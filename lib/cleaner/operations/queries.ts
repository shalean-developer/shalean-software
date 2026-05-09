import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";

/** Statuses shown on the cleaner “My jobs” board (assignment required). */
export const CLEANER_JOB_BOARD_STATUSES = [
  "assigned",
  "cleaner_en_route",
  "cleaner_arrived",
  "in_progress",
] as const;

export type CleanerBookingCardRow = {
  id: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  address_line1: string;
  locality: string | null;
  region: string | null;
  service_notes: string | null;
  row_version: number;
  total_cents: number;
  currency: string;
};

const cleanerListSelect =
  "id, status, scheduled_start, scheduled_end, address_line1, locality, region, service_notes, row_version, total_cents, currency";

export async function listActiveCleanerJobs(
  client: SupabaseClient<AppDatabase>,
  cleanerUserId: string,
): Promise<{ ok: true; rows: CleanerBookingCardRow[] } | { ok: false; message: string }> {
  const { data, error } = await client
    .from("bookings")
    .select(cleanerListSelect)
    .eq("cleaner_id", cleanerUserId)
    .in("status", [...CLEANER_JOB_BOARD_STATUSES])
    .order("scheduled_start", { ascending: true })
    .limit(100);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, rows: (data ?? []) as CleanerBookingCardRow[] };
}

export async function listRecentCleanerCompletedJobs(
  client: SupabaseClient<AppDatabase>,
  cleanerUserId: string,
  opts?: { limit?: number },
): Promise<{ ok: true; rows: CleanerBookingCardRow[] } | { ok: false; message: string }> {
  const limit = Math.min(Math.max(opts?.limit ?? 12, 1), 50);
  const { data, error } = await client
    .from("bookings")
    .select(cleanerListSelect)
    .eq("cleaner_id", cleanerUserId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, rows: (data ?? []) as CleanerBookingCardRow[] };
}

export type CleanerBookingDetail = CleanerBookingCardRow & {
  service_timezone: string;
  country_code: string;
  postal_code: string | null;
};

export type CleanerBookingEventRow = {
  id: string;
  event_type: string;
  created_at: string;
  actor_user_id: string | null;
  payload: unknown;
};

export async function getCleanerBookingDetail(
  client: SupabaseClient<AppDatabase>,
  params: { bookingId: string; cleanerUserId: string },
): Promise<
  | { ok: true; booking: CleanerBookingDetail; events: CleanerBookingEventRow[] }
  | { ok: false; code: "NOT_FOUND" | "ERROR"; message: string }
> {
  const { data, error } = await client
    .from("bookings")
    .select(
      `${cleanerListSelect}, service_timezone, country_code, postal_code`,
    )
    .eq("id", params.bookingId)
    .eq("cleaner_id", params.cleanerUserId)
    .maybeSingle();

  if (error) {
    return { ok: false, code: "ERROR", message: error.message };
  }
  if (!data) {
    return { ok: false, code: "NOT_FOUND", message: "Booking not found" };
  }

  const { data: evRows, error: evErr } = await client
    .from("booking_events")
    .select("id, event_type, created_at, actor_user_id, payload")
    .eq("booking_id", params.bookingId)
    .order("created_at", { ascending: true })
    .limit(60);

  if (evErr) {
    return { ok: false, code: "ERROR", message: evErr.message };
  }

  return {
    ok: true,
    booking: data as CleanerBookingDetail,
    events: (evRows ?? []) as CleanerBookingEventRow[],
  };
}
