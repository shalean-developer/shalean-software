import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";

export type DivergentPaymentBookingRow = {
  payment_id: string;
  booking_id: string;
  booking_status: string;
  provider_intent_id: string | null;
  amount_cents: number;
  currency: string;
};

type PaymentScanRow = {
  id: string;
  booking_id: string;
  provider_intent_id: string | null;
  amount_cents: number;
  currency: string;
};

/**
 * Operational read: Paystack captures recorded as `succeeded` while the booking is not `paid`.
 * Uses bounded payment scan + per-booking status read (simple, works with generic Supabase types).
 */
export async function findSucceededPaystackPaymentsWithNonPaidBookings(
  client: SupabaseClient<AppDatabase>,
  opts?: { limit?: number },
): Promise<
  { ok: true; rows: DivergentPaymentBookingRow[] } | { ok: false; message: string; details?: string }
> {
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 1000);

  const { data, error } = await client
    .from("payments")
    .select("id, booking_id, provider_intent_id, amount_cents, currency")
    .eq("provider", "paystack")
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      ok: false,
      message: "Failed to load payments for reconciliation scan",
      details: error.message,
    };
  }

  const rows: DivergentPaymentBookingRow[] = [];

  for (const r of (data ?? []) as PaymentScanRow[]) {
    const { data: bRow, error: bErr } = await client
      .from("bookings")
      .select("status")
      .eq("id", r.booking_id)
      .maybeSingle();

    if (bErr || !bRow) {
      continue;
    }

    const st = (bRow as { status: string }).status;
    if (st === "paid") continue;

    rows.push({
      payment_id: r.id,
      booking_id: r.booking_id,
      booking_status: st,
      provider_intent_id: r.provider_intent_id,
      amount_cents: Number(r.amount_cents),
      currency: String(r.currency),
    });
  }

  return { ok: true, rows };
}
