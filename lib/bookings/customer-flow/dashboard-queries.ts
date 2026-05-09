import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";

import { getBookingForCustomer, type CustomerBookingRow } from "./helpers";

/** Fields for list cards (RLS: `customer_id = auth.uid()`). */
export type CustomerBookingListRow = {
  id: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  address_line1: string;
  locality: string | null;
  region: string | null;
  postal_code: string | null;
  country_code: string;
  total_cents: number;
  currency: string;
  row_version: number;
  updated_at: string;
  service_notes: string | null;
};

const listSelect =
  "id, status, scheduled_start, scheduled_end, address_line1, locality, region, postal_code, country_code, total_cents, currency, row_version, updated_at, service_notes";

const PAYMENT_ATTENTION = ["draft", "awaiting_payment"] as const;
const SERVICE_PIPELINE = [
  "paid",
  "assigned",
  "cleaner_en_route",
  "cleaner_arrived",
  "in_progress",
] as const;

export type CustomerPaymentListRow = {
  id: string;
  status: string;
  provider: string;
  provider_intent_id: string | null;
  amount_cents: number;
  currency: string;
  created_at: string;
};

export type CustomerBookingEventRow = {
  id: string;
  event_type: string;
  created_at: string;
  actor_user_id: string | null;
  payload: unknown;
};

export type CustomerBookingDashboardDetail = {
  booking: CustomerBookingRow;
  payments: CustomerPaymentListRow[];
  events: CustomerBookingEventRow[];
};

export async function listCustomerBookingsNeedingPayment(
  client: SupabaseClient<AppDatabase>,
  customerId: string,
): Promise<{ ok: true; rows: CustomerBookingListRow[] } | { ok: false; message: string }> {
  const { data, error } = await client
    .from("bookings")
    .select(listSelect)
    .eq("customer_id", customerId)
    .in("status", [...PAYMENT_ATTENTION])
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, rows: (data ?? []) as CustomerBookingListRow[] };
}

export async function listCustomerUpcomingServiceBookings(
  client: SupabaseClient<AppDatabase>,
  customerId: string,
): Promise<{ ok: true; rows: CustomerBookingListRow[] } | { ok: false; message: string }> {
  const { data, error } = await client
    .from("bookings")
    .select(listSelect)
    .eq("customer_id", customerId)
    .in("status", [...SERVICE_PIPELINE])
    .order("scheduled_start", { ascending: true })
    .limit(50);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, rows: (data ?? []) as CustomerBookingListRow[] };
}

export async function listCustomerCompletedBookings(
  client: SupabaseClient<AppDatabase>,
  customerId: string,
  opts?: { limit?: number },
): Promise<{ ok: true; rows: CustomerBookingListRow[] } | { ok: false; message: string }> {
  const limit = Math.min(Math.max(opts?.limit ?? 25, 1), 80);
  const { data, error } = await client
    .from("bookings")
    .select(listSelect)
    .eq("customer_id", customerId)
    .eq("status", "completed")
    .order("scheduled_start", { ascending: false })
    .limit(limit);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, rows: (data ?? []) as CustomerBookingListRow[] };
}

export async function getCustomerBookingDashboardDetail(
  client: SupabaseClient<AppDatabase>,
  params: { bookingId: string; customerId: string },
): Promise<
  | { ok: true; detail: CustomerBookingDashboardDetail }
  | { ok: false; code: "NOT_FOUND" | "FORBIDDEN" | "ERROR"; message: string }
> {
  const bookingLoad = await getBookingForCustomer(client, {
    bookingId: params.bookingId,
    customerId: params.customerId,
  });

  if (!bookingLoad.ok) {
    return {
      ok: false,
      code: bookingLoad.code === "FORBIDDEN" ? "FORBIDDEN" : "NOT_FOUND",
      message: "Booking not found or access denied.",
    };
  }

  const bookingId = params.bookingId;

  const [paymentsRes, eventsRes] = await Promise.all([
    client
      .from("payments")
      .select("id, status, provider, provider_intent_id, amount_cents, currency, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(40),
    client
      .from("booking_events")
      .select("id, event_type, created_at, actor_user_id, payload")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true })
      .limit(80),
  ]);

  if (paymentsRes.error) {
    return { ok: false, code: "ERROR", message: paymentsRes.error.message };
  }
  if (eventsRes.error) {
    return { ok: false, code: "ERROR", message: eventsRes.error.message };
  }

  return {
    ok: true,
    detail: {
      booking: bookingLoad.booking,
      payments: (paymentsRes.data ?? []) as CustomerPaymentListRow[],
      events: (eventsRes.data ?? []) as CustomerBookingEventRow[],
    },
  };
}
