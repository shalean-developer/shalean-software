import type { SupabaseClient } from "@supabase/supabase-js";

import { updateBookingStatus } from "@/lib/bookings/update";
import type { AppDatabase } from "@/src/lib/supabase";

import type { PaymentBookingDivergence, PaymentVerificationResult } from "../types";

export type PaystackVerifyShape = {
  status: string;
  reference: string;
  id: number;
  amount: number;
  currency: string;
  paid_at: string | null;
};

function buildDivergence(params: {
  payment_id: string;
  booking_id: string;
  provider_reference: string;
  booking_status: string;
  transition_failure_code?: string;
}): PaymentBookingDivergence {
  return {
    kind: "PAYMENT_SUCCEEDED_BOOKING_NOT_PAID",
    payment_id: params.payment_id,
    booking_id: params.booking_id,
    provider_reference: params.provider_reference,
    booking_status: params.booking_status,
    payment_status: "succeeded",
    ...(params.transition_failure_code
      ? { transition_failure_code: params.transition_failure_code }
      : {}),
  };
}

/**
 * Persists a successful Paystack verification and moves the booking to `paid`
 * when it is still `awaiting_payment`, via {@link updateBookingStatus} only.
 *
 * **Integrity:** If `payments` becomes `succeeded` while the booking cannot be `paid`,
 * returns `ok: false` with `BOOKING_PAYMENT_STATE_CONFLICT` or `BOOKING_TRANSITION_FAILED`
 * and a structured `conflict` payload — never `ok: true` with a non-`paid` booking.
 */
export async function applySuccessfulPaystackVerification(
  client: SupabaseClient<AppDatabase>,
  params: {
    payment_id: string;
    booking_id: string;
    verify: PaystackVerifyShape;
  },
): Promise<PaymentVerificationResult> {
  const { payment_id, booking_id, verify } = params;

  if (verify.status !== "success") {
    return {
      ok: false,
      code: "PAYSTACK_ERROR",
      message: `Paystack transaction not successful (status=${verify.status})`,
    };
  }

  const { data: payment, error: payFetchErr } = await client
    .from("payments")
    .select("id, status, booking_id, metadata")
    .eq("id", payment_id)
    .maybeSingle();

  if (payFetchErr || !payment) {
    return {
      ok: false,
      code: "PAYMENT_NOT_FOUND",
      message: "Payment row not found",
      details: payFetchErr?.message,
    };
  }

  const pay = payment as {
    id: string;
    status: string;
    booking_id: string;
    metadata: unknown;
  };

  if (pay.booking_id !== booking_id) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Payment booking_id mismatch",
    };
  }

  const { data: booking, error: bookingErr } = await client
    .from("bookings")
    .select("id, status, total_cents, currency, row_version")
    .eq("id", booking_id)
    .maybeSingle();

  if (bookingErr || !booking) {
    return {
      ok: false,
      code: "BOOKING_NOT_FOUND",
      message: "Booking not found for payment",
      details: bookingErr?.message,
    };
  }

  const b = booking as {
    id: string;
    status: string;
    total_cents: number;
    currency: string;
    row_version: number;
  };

  if (Number(verify.amount) !== b.total_cents) {
    return {
      ok: false,
      code: "AMOUNT_MISMATCH",
      message: "Verified Paystack amount does not match booking total",
    };
  }

  if (verify.currency?.toUpperCase() !== String(b.currency).toUpperCase()) {
    return {
      ok: false,
      code: "AMOUNT_MISMATCH",
      message: "Verified Paystack currency does not match booking currency",
    };
  }

  const capturedAt = verify.paid_at ?? new Date().toISOString();
  const chargeId = String(verify.id);

  if (pay.status !== "succeeded") {
    const { data: updated, error: updErr } = await client
      .from("payments")
      .update({
        status: "succeeded",
        provider_charge_id: chargeId,
        captured_at: capturedAt,
        failure_code: null,
        failure_message: null,
      } as never)
      .eq("id", payment_id)
      .in("status", ["pending", "processing", "requires_action"])
      .select("id")
      .maybeSingle();

    if (updErr) {
      return {
        ok: false,
        code: "DATABASE_ERROR",
        message: "Failed to update payment to succeeded",
        details: updErr.message,
      };
    }

    if (!updated) {
      const { data: again } = await client
        .from("payments")
        .select("status")
        .eq("id", payment_id)
        .maybeSingle();
      const st = (again as { status: string } | null)?.status;
      if (st !== "succeeded") {
        return {
          ok: false,
          code: "DATABASE_ERROR",
          message: "Payment was not in an updatable state",
        };
      }
    }
  }

  if (b.status === "paid") {
    return {
      ok: true,
      payment_id,
      provider_reference: verify.reference,
      paystack_status: verify.status,
      booking_marked_paid: false,
      reconciliation: { state: "aligned_idempotent" },
    };
  }

  if (b.status !== "awaiting_payment") {
    return {
      ok: false,
      code: "BOOKING_PAYMENT_STATE_CONFLICT",
      message:
        "Paystack charge succeeded and payment is recorded, but the booking is not awaiting payment — manual reconciliation required",
      conflict: buildDivergence({
        payment_id,
        booking_id: b.id,
        provider_reference: verify.reference,
        booking_status: b.status,
      }),
    };
  }

  const transition = await updateBookingStatus(
    client,
    {
      booking_id: b.id,
      expected_row_version: b.row_version,
      next_status: "paid",
      allow_no_op: true,
    },
    {
      authorize: async () => {
        /* Trusted server context (webhook / verify route). */
      },
    },
  );

  if (!transition.ok) {
    return {
      ok: false,
      code: "BOOKING_TRANSITION_FAILED",
      message: transition.message,
      details: transition.code,
      conflict: buildDivergence({
        payment_id,
        booking_id: b.id,
        provider_reference: verify.reference,
        booking_status: b.status,
        transition_failure_code: transition.code,
      }),
    };
  }

  const marked = !transition.no_op;

  return {
    ok: true,
    payment_id,
    provider_reference: verify.reference,
    paystack_status: verify.status,
    booking_marked_paid: marked,
    reconciliation: {
      state: "aligned",
      booking_marked_paid_this_call: marked,
    },
  };
}
