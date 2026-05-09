import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";

const WINDOW_DAYS = 30;

function windowStartIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - WINDOW_DAYS);
  return d.toISOString();
}

export type CleanerOperationalProfileSummary = {
  /** Informational — same tables operations already trust. */
  completed_all_time: number;
  completed_last_30d: number;
  cancelled_last_30d: number;
  completion_share_in_window: number | null;
  window_days: number;
};

/**
 * Workforce-facing performance snapshot from `bookings` rows assigned to the cleaner — no parallel HR store.
 */
export async function loadCleanerOperationalProfileSummary(
  client: SupabaseClient<AppDatabase>,
  cleanerUserId: string,
): Promise<{ ok: true; summary: CleanerOperationalProfileSummary } | { ok: false; message: string }> {
  const start = windowStartIso();

  const [allTimeCompleted, winCompleted, winCancelled] = await Promise.all([
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("cleaner_id", cleanerUserId)
      .eq("status", "completed"),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("cleaner_id", cleanerUserId)
      .eq("status", "completed")
      .gte("completed_at", start),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("cleaner_id", cleanerUserId)
      .eq("status", "cancelled")
      .gte("updated_at", start),
  ]);

  const err = allTimeCompleted.error ?? winCompleted.error ?? winCancelled.error;
  if (err) {
    return { ok: false, message: err.message };
  }

  const completed_last_30d = winCompleted.count ?? 0;
  const cancelled_last_30d = winCancelled.count ?? 0;
  const denom = completed_last_30d + cancelled_last_30d;

  return {
    ok: true,
    summary: {
      completed_all_time: allTimeCompleted.count ?? 0,
      completed_last_30d,
      cancelled_last_30d,
      completion_share_in_window: denom > 0 ? completed_last_30d / denom : null,
      window_days: WINDOW_DAYS,
    },
  };
}
