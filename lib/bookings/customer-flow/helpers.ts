import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";

export type CustomerBookingRow = {
  id: string;
  status: string;
  row_version: number;
  customer_id: string;
  scheduled_start: string;
  scheduled_end: string;
  address_line1: string;
  locality: string | null;
  region: string | null;
  postal_code: string | null;
  country_code: string;
  currency: string;
  subtotal_cents: number;
  fees_cents: number;
  tax_cents: number;
  total_cents: number;
  service_notes: string | null;
};

export async function getBookingForCustomer(
  client: SupabaseClient<AppDatabase>,
  params: { bookingId: string; customerId: string },
): Promise<{ ok: true; booking: CustomerBookingRow } | { ok: false; code: "NOT_FOUND" | "FORBIDDEN" }> {
  const { data, error } = await client
    .from("bookings")
    .select(
      "id, status, row_version, customer_id, scheduled_start, scheduled_end, address_line1, locality, region, postal_code, country_code, currency, subtotal_cents, fees_cents, tax_cents, total_cents, service_notes",
    )
    .eq("id", params.bookingId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const row = data as CustomerBookingRow;
  if (row.customer_id !== params.customerId) {
    return { ok: false, code: "FORBIDDEN" };
  }

  return { ok: true, booking: row };
}
