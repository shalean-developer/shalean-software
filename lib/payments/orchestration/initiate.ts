import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";

import { paystackInitializeTransaction } from "../paystack/client";
import type { PaymentInitiationResult } from "../types";
import { initiatePaymentInputSchema } from "./schemas";

/**
 * Creates a `payments` row and opens a Paystack `transaction/initialize` session.
 * Booking must be `awaiting_payment`. Booking status is **not** changed here.
 */
export async function initiatePaymentForBooking(
  client: SupabaseClient<AppDatabase>,
  rawInput: unknown,
): Promise<PaymentInitiationResult> {
  const parsed = initiatePaymentInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Invalid initiate payload",
      details: parsed.error.message,
    };
  }

  const input = parsed.data;

  if (input.idempotency_key) {
    const { data: prior, error: idemErr } = await client
      .from("payments")
      .select("id, metadata, provider_intent_id, status")
      .eq("booking_id", input.booking_id)
      .eq("provider", "paystack")
      .filter("metadata->>idempotency_key", "eq", input.idempotency_key)
      .maybeSingle();

    if (idemErr) {
      return {
        ok: false,
        code: "DATABASE_ERROR",
        message: "Idempotency lookup failed",
        details: idemErr.message,
      };
    }

    if (prior) {
      const p = prior as {
        id: string;
        metadata: unknown;
        provider_intent_id: string | null;
        status: string;
      };
      const meta = p.metadata as Record<string, unknown> | null;
      const paystack = meta?.paystack as Record<string, unknown> | undefined;
      const url =
        typeof paystack?.authorization_url === "string"
          ? paystack.authorization_url
          : undefined;
      const access =
        typeof paystack?.access_code === "string" ? paystack.access_code : undefined;
      if (url && access && p.provider_intent_id) {
        const { data: bv } = await client
          .from("bookings")
          .select("row_version")
          .eq("id", input.booking_id)
          .maybeSingle();
        const rv = (bv as { row_version: number } | null)?.row_version ?? 0;
        return {
          ok: true,
          payment_id: p.id,
          provider_reference: p.provider_intent_id,
          authorization_url: url,
          access_code: access,
          booking_row_version: rv,
        };
      }
    }
  }

  const { data: booking, error: bErr } = await client
    .from("bookings")
    .select("id, status, total_cents, currency, row_version")
    .eq("id", input.booking_id)
    .maybeSingle();

  if (bErr || !booking) {
    return {
      ok: false,
      code: "BOOKING_NOT_FOUND",
      message: "Booking not found",
      details: bErr?.message,
    };
  }

  const b = booking as {
    id: string;
    status: string;
    total_cents: number;
    currency: string;
    row_version: number;
  };

  if (b.status !== "awaiting_payment") {
    return {
      ok: false,
      code: "BOOKING_NOT_READY",
      message: `Booking must be awaiting_payment to initiate Paystack (got ${b.status})`,
    };
  }

  const reference = `bk_${b.id.slice(0, 8)}_${randomUUID().replace(/-/g, "")}`;

  const init = await paystackInitializeTransaction({
    email: input.payer_email,
    amountSubunit: b.total_cents,
    currency: String(b.currency).toUpperCase(),
    reference,
    callback_url: input.callback_url,
    metadata: {
      booking_id: b.id,
      ...(input.idempotency_key
        ? { idempotency_key: input.idempotency_key }
        : {}),
    },
  });

  if (!init.ok) {
    // Exact Paystack / transport reason is logged in `paystackInitializeTransaction` (server-only).
    // Keep API / redirects generic for customers.
    return {
      ok: false,
      code: "PAYSTACK_ERROR",
      message: "Paystack could not start checkout.",
      details: String(init.status),
    };
  }

  const meta: Record<string, unknown> = {
    paystack: {
      authorization_url: init.data.authorization_url,
      access_code: init.data.access_code,
      initiated_at: new Date().toISOString(),
    },
    ...(input.idempotency_key ? { idempotency_key: input.idempotency_key } : {}),
  };

  const { data: inserted, error: insErr } = await client
    .from("payments")
    .insert({
      booking_id: b.id,
      status: "pending",
      provider: "paystack",
      provider_intent_id: init.data.reference,
      amount_cents: b.total_cents,
      currency: String(b.currency).toUpperCase(),
      metadata: meta,
    } as never)
    .select("id")
    .single();

  if (insErr || !inserted) {
    if (
      insErr?.message?.includes("duplicate") ||
      insErr?.code === "23505"
    ) {
      return {
        ok: false,
        code: "DATABASE_ERROR",
        message: "Duplicate Paystack reference — retry with a new idempotency key",
        details: insErr?.message,
      };
    }
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Failed to create payment row",
      details: insErr?.message,
    };
  }

  const row = inserted as { id: string };

  return {
    ok: true,
    payment_id: row.id,
    provider_reference: init.data.reference,
    authorization_url: init.data.authorization_url,
    access_code: init.data.access_code,
    booking_row_version: b.row_version,
  };
}
