import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";

const SERVICE_PIPELINE = [
  "paid",
  "assigned",
  "cleaner_en_route",
  "cleaner_arrived",
  "in_progress",
] as const;

const INACTIVE_DAYS = 60;

function medianDaysBetween(sortedIsoDatesAsc: string[]): number | null {
  if (sortedIsoDatesAsc.length < 2) return null;
  const ms = sortedIsoDatesAsc.map((s) => new Date(s).getTime());
  const gaps: number[] = [];
  for (let i = 1; i < ms.length; i += 1) {
    gaps.push((ms[i] - ms[i - 1]) / 86400000);
  }
  if (gaps.length === 0) return null;
  const s = [...gaps].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type CustomerRetentionInsights = {
  /** Derived from `bookings` for this customer only — recommendation / UX only. */
  total_bookings: number;
  completed_bookings: number;
  is_repeat_customer: boolean;
  first_booking_at: string | null;
  last_completed_at: string | null;
  days_since_last_completion: number | null;
  median_days_between_completions: number | null;
  cadence_sample_size: number;
  has_upcoming_visit: boolean;
  /** True when last completion is older than threshold and no upcoming paid pipeline visit. */
  inactive_reengagement_hint: boolean;
  trust_tier: "first_time" | "returning" | "frequent";
};

/**
 * Read-only retention signals for customer surfaces — does not mutate lifecycle or enqueue notifications.
 */
export async function loadCustomerRetentionInsights(
  client: SupabaseClient<AppDatabase>,
  customerId: string,
): Promise<{ ok: true; insights: CustomerRetentionInsights } | { ok: false; message: string }> {
  const [
    totalRes,
    completedCountRes,
    firstRes,
    completedRowsRes,
    upcomingRes,
  ] = await Promise.all([
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customerId),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("status", "completed"),
    client
      .from("bookings")
      .select("created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    client
      .from("bookings")
      .select("completed_at")
      .eq("customer_id", customerId)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(36),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .in("status", [...SERVICE_PIPELINE]),
  ]);

  const err =
    totalRes.error ?? completedCountRes.error ?? firstRes.error ?? completedRowsRes.error ?? upcomingRes.error;
  if (err) {
    return { ok: false, message: err.message };
  }

  const completedRows = (completedRowsRes.data ?? []) as { completed_at: string }[];
  const ascending = [...completedRows].reverse().map((r) => r.completed_at);
  const last_completed_at = completedRows[0]?.completed_at ?? null;

  let days_since_last_completion: number | null = null;
  if (last_completed_at) {
    days_since_last_completion = Math.floor(
      (Date.now() - new Date(last_completed_at).getTime()) / 86400000,
    );
  }

  const completed_bookings = completedCountRes.count ?? 0;
  const median_days_between_completions = medianDaysBetween(ascending);
  const has_upcoming_visit = (upcomingRes.count ?? 0) > 0;

  const inactive_reengagement_hint =
    completed_bookings > 0 &&
    !has_upcoming_visit &&
    days_since_last_completion !== null &&
    days_since_last_completion >= INACTIVE_DAYS;

  let trust_tier: CustomerRetentionInsights["trust_tier"] = "first_time";
  if (completed_bookings >= 3) trust_tier = "frequent";
  else if (completed_bookings >= 1) trust_tier = "returning";

  return {
    ok: true,
    insights: {
      total_bookings: totalRes.count ?? 0,
      completed_bookings,
      is_repeat_customer: completed_bookings >= 2,
      first_booking_at: (firstRes.data as { created_at: string } | null)?.created_at ?? null,
      last_completed_at,
      days_since_last_completion,
      median_days_between_completions,
      cadence_sample_size: ascending.length,
      has_upcoming_visit,
      inactive_reengagement_hint,
      trust_tier,
    },
  };
}
