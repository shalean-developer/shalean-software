import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";

import { logPaystackVerificationOutcome } from "../reconciliation/log-context";
import { paystackVerifyTransaction } from "../paystack/client";
import type { PaymentVerificationResult } from "../types";
import { applySuccessfulPaystackVerification } from "./apply-verification";
import { verifyPaymentInputSchema } from "./schemas";

/**
 * Server-side verification (callback route, cron, or support tool).
 * Always calls Paystack verify API — do not trust client-only redirects.
 */
export async function verifyPaymentByProviderReference(
  client: SupabaseClient<AppDatabase>,
  rawInput: unknown,
): Promise<PaymentVerificationResult> {
  const parsed = verifyPaymentInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Invalid verify payload",
      details: parsed.error.message,
    };
  }

  const reference = parsed.data.provider_reference;

  const { data: payment, error: pErr } = await client
    .from("payments")
    .select("id, booking_id, status, provider")
    .eq("provider", "paystack")
    .eq("provider_intent_id", reference)
    .maybeSingle();

  if (pErr || !payment) {
    return {
      ok: false,
      code: "PAYMENT_NOT_FOUND",
      message: "No payment row for this Paystack reference",
      details: pErr?.message,
    };
  }

  const pay = payment as {
    id: string;
    booking_id: string;
    status: string;
    provider: string;
  };

  if (pay.provider !== "paystack") {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Unexpected payment provider",
    };
  }

  const remote = await paystackVerifyTransaction(reference);
  if (!remote.ok) {
    return {
      ok: false,
      code: "PAYSTACK_ERROR",
      message: remote.message,
      details: String(remote.status),
    };
  }

  if (remote.data.status !== "success") {
    await client
      .from("payments")
      .update({
        status: "failed",
        failure_code: "paystack_not_success",
        failure_message: `Paystack status=${remote.data.status}`,
      } as never)
      .eq("id", pay.id)
      .in("status", ["pending", "processing", "requires_action"]);

    return {
      ok: false,
      code: "PAYSTACK_ERROR",
      message: `Transaction not successful (status=${remote.data.status})`,
    };
  }

  const applied = await applySuccessfulPaystackVerification(client, {
    payment_id: pay.id,
    booking_id: pay.booking_id,
    verify: remote.data,
  });

  logPaystackVerificationOutcome(applied, { source: "verify_api" });

  return applied;
}
