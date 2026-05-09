import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { AppDatabase } from "@/src/lib/supabase";

import { getPaystackSecretKey } from "../paystack/env";
import { verifyPaystackWebhookSignature } from "../paystack/signature";
import { logPaystackVerificationOutcome } from "../reconciliation/log-context";
import type { PaymentVerificationFailure, WebhookProcessResult } from "../types";
import { paystackVerifyTransaction } from "../paystack/client";
import { applySuccessfulPaystackVerification } from "./apply-verification";

const paystackEventSchema = z
  .object({
    event: z.string(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

function readReference(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const ref = data.reference;
  return typeof ref === "string" ? ref : null;
}

function webhookReconciliationAck(
  dedupeKey: string,
  conflict: NonNullable<PaymentVerificationFailure["conflict"]>,
): WebhookProcessResult {
  logPaystackVerificationOutcome(
    {
      ok: false,
      code: "BOOKING_PAYMENT_STATE_CONFLICT",
      message:
        "Paystack webhook: payment row succeeded but booking is not paid — reconciliation_required (HTTP 200 for provider idempotency)",
      conflict,
    },
    { source: "webhook" },
  );

  return {
    ok: true,
    dedupe_key: dedupeKey,
    ignored: false,
    booking_marked_paid: false,
    reconciliation_required: true,
    conflict,
  };
}

/**
 * Processes a raw Paystack webhook body (after optional queue ingestion).
 * Verifies HMAC signature, then **re-verifies** the transaction via Paystack API.
 */
export async function processPaystackWebhook(
  client: SupabaseClient<AppDatabase>,
  rawBody: string,
  signatureHeader: string | null | undefined,
): Promise<WebhookProcessResult> {
  let secret: string;
  try {
    secret = getPaystackSecretKey();
  } catch (e) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: e instanceof Error ? e.message : "Paystack secret not configured",
    };
  }

  if (!verifyPaystackWebhookSignature(rawBody, signatureHeader, secret)) {
    return {
      ok: false,
      code: "SIGNATURE_INVALID",
      message: "Invalid Paystack webhook signature",
    };
  }

  let body: z.infer<typeof paystackEventSchema>;
  try {
    body = paystackEventSchema.parse(JSON.parse(rawBody));
  } catch {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Invalid webhook JSON",
    };
  }

  const dedupeKey =
    typeof body.data?.id === "number"
      ? String(body.data.id)
      : readReference(body.data as Record<string, unknown> | undefined) ??
        body.event;

  if (body.event === "charge.success") {
    const reference = readReference(body.data as Record<string, unknown> | undefined);
    if (!reference) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "charge.success missing data.reference",
      };
    }

    const { data: payment, error: pErr } = await client
      .from("payments")
      .select("id, booking_id, status, provider_intent_id")
      .eq("provider", "paystack")
      .eq("provider_intent_id", reference)
      .maybeSingle();

    if (pErr) {
      return {
        ok: false,
        code: "DATABASE_ERROR",
        message: pErr.message,
      };
    }

    if (!payment) {
      return {
        ok: true,
        dedupe_key: dedupeKey,
        ignored: true,
        booking_marked_paid: false,
      };
    }

    const pay = payment as {
      id: string;
      booking_id: string;
      status: string;
      provider_intent_id: string | null;
    };

    if (pay.status === "succeeded") {
      const { data: bRow, error: bErr } = await client
        .from("bookings")
        .select("status")
        .eq("id", pay.booking_id)
        .maybeSingle();

      if (bErr) {
        return {
          ok: false,
          code: "DATABASE_ERROR",
          message: bErr.message,
        };
      }

      const bookingStatus = (bRow as { status: string } | null)?.status;
      if (bookingStatus === "paid") {
        return {
          ok: true,
          dedupe_key: dedupeKey,
          ignored: true,
          booking_marked_paid: false,
        };
      }

      if (bookingStatus && bookingStatus !== "paid") {
        return webhookReconciliationAck(dedupeKey, {
          kind: "PAYMENT_SUCCEEDED_BOOKING_NOT_PAID",
          payment_id: pay.id,
          booking_id: pay.booking_id,
          provider_reference: pay.provider_intent_id ?? reference,
          booking_status: bookingStatus,
          payment_status: "succeeded",
        });
      }

      return webhookReconciliationAck(dedupeKey, {
        kind: "PAYMENT_SUCCEEDED_BOOKING_NOT_PAID",
        payment_id: pay.id,
        booking_id: pay.booking_id,
        provider_reference: pay.provider_intent_id ?? reference,
        booking_status: "unknown",
        payment_status: "succeeded",
      });
    }

    const remote = await paystackVerifyTransaction(reference);
    if (!remote.ok) {
      return {
        ok: false,
        code: "PAYSTACK_ERROR",
        message: remote.message,
      };
    }

    if (remote.data.status !== "success") {
      await client
        .from("payments")
        .update({
          status: "failed",
          failure_code: "paystack_not_success",
          failure_message: `status=${remote.data.status}`,
        } as never)
        .eq("id", pay.id)
        .in("status", ["pending", "processing", "requires_action"]);

      return {
        ok: true,
        dedupe_key: dedupeKey,
        ignored: false,
        booking_marked_paid: false,
      };
    }

    const applied = await applySuccessfulPaystackVerification(client, {
      payment_id: pay.id,
      booking_id: pay.booking_id,
      verify: remote.data,
    });

    if (!applied.ok) {
      if (applied.conflict) {
        return webhookReconciliationAck(dedupeKey, applied.conflict);
      }
      return {
        ok: false,
        code: applied.code,
        message: applied.message,
      };
    }

    return {
      ok: true,
      dedupe_key: dedupeKey,
      ignored: false,
      booking_marked_paid: applied.booking_marked_paid,
    };
  }

  if (body.event === "charge.failed") {
    const reference = readReference(body.data as Record<string, unknown> | undefined);
    if (reference) {
      const msg =
        typeof body.data?.message === "string"
          ? body.data.message
          : "charge.failed";
      await client
        .from("payments")
        .update({
          status: "failed",
          failure_code: "paystack_charge_failed",
          failure_message: msg,
        } as never)
        .eq("provider", "paystack")
        .eq("provider_intent_id", reference)
        .in("status", ["pending", "processing", "requires_action"]);
    }
    return {
      ok: true,
      dedupe_key: dedupeKey,
      ignored: false,
      booking_marked_paid: false,
    };
  }

  return {
    ok: true,
    dedupe_key: dedupeKey,
    ignored: true,
    booking_marked_paid: false,
  };
}
