import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { findSucceededPaystackPaymentsWithNonPaidBookings } from "@/lib/payments/reconciliation";
import { describeQueryFailure } from "@/lib/operational/query-error";
import type { AppDatabase } from "@/src/lib/supabase";

import { ANALYTICS_DEFAULTS, OPS_THRESHOLDS } from "./thresholds";
import type {
  AdminAnalyticsSnapshot,
  DailyCount,
  SlaSurfaceFlag,
} from "./types";

function utcMidnight(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** `daysBack=0` → today's UTC bucket start/end (end exclusive). */
function utcDayBucket(daysBack: number): { start: string; endExclusive: string; label: string } {
  const startDate = utcMidnight(new Date());
  startDate.setUTCDate(startDate.getUTCDate() - daysBack);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  return {
    start: startDate.toISOString(),
    endExclusive: endDate.toISOString(),
    label: startDate.toISOString().slice(0, 10),
  };
}

function funnelWindowStartUtc(days: number): string {
  const d = utcMidnight(new Date());
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

async function promisePool<T>(
  factories: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < factories.length; i += concurrency) {
    const slice = factories.slice(i, i + concurrency).map((fn) => fn());
    out.push(...(await Promise.all(slice)));
  }
  return out;
}

/** Exact UTC-day counts (head queries) — avoids row-limit truncation on busy tenants. */
async function loadDailyBookingCreates(
  client: SupabaseClient<AppDatabase>,
  trendDays: number,
): Promise<{ ok: true; series: DailyCount[] } | { ok: false; message: string }> {
  const factories: Array<() => Promise<DailyCount>> = [];
  for (let d = trendDays - 1; d >= 0; d--) {
    const { start, endExclusive, label } = utcDayBucket(d);
    factories.push(async () => {
      const { count, error } = await client
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start)
        .lt("created_at", endExclusive);
      if (error) {
        throw new Error(describeQueryFailure(error));
      }
      return { date: label, count: count ?? 0 };
    });
  }
  try {
    const series = await promisePool(factories, ANALYTICS_DEFAULTS.HEAD_QUERY_CONCURRENCY);
    return { ok: true, series };
  } catch (e) {
    return { ok: false, message: describeQueryFailure(e) };
  }
}

async function loadDailyPaymentReceivedEvents(
  client: SupabaseClient<AppDatabase>,
  trendDays: number,
): Promise<{ ok: true; series: DailyCount[] } | { ok: false; message: string }> {
  const factories: Array<() => Promise<DailyCount>> = [];
  for (let d = trendDays - 1; d >= 0; d--) {
    const { start, endExclusive, label } = utcDayBucket(d);
    factories.push(async () => {
      const { count, error } = await client
        .from("booking_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "PAYMENT_RECEIVED")
        .gte("created_at", start)
        .lt("created_at", endExclusive);
      if (error) {
        throw new Error(describeQueryFailure(error));
      }
      return { date: label, count: count ?? 0 };
    });
  }
  try {
    const series = await promisePool(factories, ANALYTICS_DEFAULTS.HEAD_QUERY_CONCURRENCY);
    return { ok: true, series };
  } catch (e) {
    return { ok: false, message: describeQueryFailure(e) };
  }
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function buildSlaSurfaces(s: Omit<AdminAnalyticsSnapshot, "sla_surfaces">): SlaSurfaceFlag[] {
  const flags: SlaSurfaceFlag[] = [];
  if (s.reconciliation.divergent_payment_rows > 0) {
    flags.push({
      id: "reconciliation",
      severity: s.reconciliation.divergent_payment_rows >= 5 ? "critical" : "warning",
      label: `${s.reconciliation.divergent_payment_rows} payment/booking divergence sample(s) — reconcile`,
    });
  }
  if (s.ops_health.stuck_awaiting_payment_48h >= 5) {
    flags.push({
      id: "stuck_checkout",
      severity: "warning",
      label: `${s.ops_health.stuck_awaiting_payment_48h} bookings awaiting payment >48h`,
    });
  }
  if (s.ops_health.in_progress_stale_24h >= 3) {
    flags.push({
      id: "stale_in_progress",
      severity: "warning",
      label: `${s.ops_health.in_progress_stale_24h} in-progress bookings stale >24h`,
    });
  }
  if (s.notifications.failed >= 10) {
    flags.push({
      id: "outbox_failed",
      severity: "critical",
      label: `${s.notifications.failed} notification outbox rows in failed state`,
    });
  }
  if (s.payments.failed_rate !== null && s.payments.failed_rate > 0.25 && s.payments.succeeded + s.payments.failed >= 8) {
    flags.push({
      id: "pay_fail_rate",
      severity: "warning",
      label: `High payment failure rate (${Math.round(s.payments.failed_rate * 100)}%) in window`,
    });
  }
  return flags;
}

/**
 * Dispatcher/admin analytics — read-only aggregates from bookings, payments,
 * booking_events, reconciliation scan, notification_outbox.
 */
export async function loadAdminAnalyticsSnapshot(
  client: SupabaseClient<AppDatabase>,
): Promise<{ ok: true; snapshot: AdminAnalyticsSnapshot } | { ok: false; message: string }> {
  const trendDays = ANALYTICS_DEFAULTS.TREND_DAYS;
  const funnelDays = ANALYTICS_DEFAULTS.FUNNEL_WINDOW_DAYS;
  const now = Date.now();
  const funnelStart = funnelWindowStartUtc(funnelDays);
  const iso48h = new Date(now - OPS_THRESHOLDS.AWAITING_PAYMENT_STUCK_HOURS * 3600000).toISOString();
  const iso72h = new Date(now - OPS_THRESHOLDS.ASSIGNED_STUCK_HOURS * 3600000).toISOString();
  const iso24h = new Date(now - OPS_THRESHOLDS.IN_PROGRESS_STALE_HOURS * 3600000).toISOString();
  const iso24hAwait = new Date(now - OPS_THRESHOLDS.AWAITING_PAYMENT_WARN_HOURS * 3600000).toISOString();

  const [dailyBookingsTrend, dailyPayEventsTrend, recon] = await Promise.all([
    loadDailyBookingCreates(client, trendDays),
    loadDailyPaymentReceivedEvents(client, trendDays),
    findSucceededPaystackPaymentsWithNonPaidBookings(client, { limit: 200 }),
  ]);

  if (!dailyBookingsTrend.ok) {
    return { ok: false, message: dailyBookingsTrend.message };
  }
  if (!dailyPayEventsTrend.ok) {
    return { ok: false, message: dailyPayEventsTrend.message };
  }
  if (!recon.ok) {
    return { ok: false, message: recon.message };
  }

  const [
    paymentsAttempted,
    paymentsSucceeded,
    paymentsFailed,
    funnelCreated,
    funnelPipeline,
    funnelCancelled,
    stuckAwait48,
    stuckAssign72,
    inProgStale,
    awaitStale24,
    pendingOutbox,
    processingOutbox,
    failedOutbox,
    sentOutboxWin,
    skippedOutboxWin,
    failedOutboxWin,
    assignmentEvents,
    completedRows,
    activeCleanersRes,
    needsAssignCap,
    activeFieldCap,
    repeatCompletionRows,
  ] = await Promise.all([
    client
      .from("payments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", funnelStart),
    client
      .from("payments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", funnelStart)
      .eq("status", "succeeded"),
    client
      .from("payments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", funnelStart)
      .eq("status", "failed"),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", funnelStart),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", funnelStart)
      .in("status", [
        "paid",
        "assigned",
        "cleaner_en_route",
        "cleaner_arrived",
        "in_progress",
        "completed",
      ]),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", funnelStart)
      .eq("status", "cancelled"),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "awaiting_payment")
      .lt("updated_at", iso48h),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "assigned")
      .not("cleaner_id", "is", null)
      .lt("updated_at", iso72h),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress")
      .lt("updated_at", iso24h),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "awaiting_payment")
      .lt("updated_at", iso24hAwait),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing"),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("processed_at", funnelStart),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "skipped")
      .gte("processed_at", funnelStart),
    client
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("processed_at", funnelStart),
    client
      .from("booking_events")
      .select("booking_id, event_type, created_at")
      .in("event_type", ["PAYMENT_RECEIVED", "BOOKING_ASSIGNED"])
      .gte("created_at", funnelWindowStartUtc(30))
      .order("created_at", { ascending: true })
      .limit(ANALYTICS_DEFAULTS.ASSIGNMENT_DELAY_SAMPLE_LIMIT),
    client
      .from("bookings")
      .select("scheduled_start, completed_at, cleaner_id")
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .gte("completed_at", funnelStart)
      .limit(ANALYTICS_DEFAULTS.COMPLETED_BOOKINGS_SAMPLE_LIMIT),
    client
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "cleaner")
      .eq("is_active", true),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid")
      .is("cleaner_id", null),
    client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("status", ["assigned", "cleaner_en_route", "cleaner_arrived", "in_progress"]),
    client
      .from("bookings")
      .select("customer_id")
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .gte("completed_at", funnelStart)
      .limit(4000),
  ]);

  const batchCheck: [string, { error: unknown }][] = [
    ["payments count (funnel window)", paymentsAttempted],
    ["payments succeeded count", paymentsSucceeded],
    ["payments failed count", paymentsFailed],
    ["bookings funnel created", funnelCreated],
    ["bookings funnel pipeline", funnelPipeline],
    ["bookings funnel cancelled", funnelCancelled],
    ["bookings stuck awaiting_payment 48h", stuckAwait48],
    ["bookings stuck assigned 72h", stuckAssign72],
    ["bookings in_progress stale 24h", inProgStale],
    ["bookings awaiting_payment stale 24h", awaitStale24],
    ["notification_outbox pending count", pendingOutbox],
    ["notification_outbox processing count", processingOutbox],
    ["notification_outbox failed count", failedOutbox],
    ["notification_outbox sent in window", sentOutboxWin],
    ["notification_outbox skipped in window", skippedOutboxWin],
    ["notification_outbox failed in window", failedOutboxWin],
    ["booking_events assignment delay sample", assignmentEvents],
    ["bookings completed sample", completedRows],
    ["users active cleaners count", activeCleanersRes],
    ["bookings needs_assignment capacity", needsAssignCap],
    ["bookings active_field_pipeline capacity", activeFieldCap],
    ["bookings repeat completion sample", repeatCompletionRows],
  ];
  for (const [label, row] of batchCheck) {
    if (row.error) {
      return {
        ok: false,
        message: `${label}: ${describeQueryFailure(row.error)}`,
      };
    }
  }

  const daily_bookings_created = dailyBookingsTrend.series;
  const daily_payment_received_events = dailyPayEventsTrend.series;

  const attempts = paymentsAttempted.count ?? 0;
  const succeeded = paymentsSucceeded.count ?? 0;
  const failed = paymentsFailed.count ?? 0;
  const denomPay = succeeded + failed;
  const payments = {
    attempts,
    succeeded,
    failed,
    failed_rate: denomPay > 0 ? failed / denomPay : null,
  };

  const bookings_created = funnelCreated.count ?? 0;
  const reached_paid_pipeline = funnelPipeline.count ?? 0;
  const cancelled = funnelCancelled.count ?? 0;
  const funnel = {
    bookings_created,
    reached_paid_pipeline,
    draft_to_paid_pipeline_rate:
      bookings_created > 0 ? reached_paid_pipeline / bookings_created : null,
    cancelled,
    cancellation_rate: bookings_created > 0 ? cancelled / bookings_created : null,
  };

  type EvRow = { booking_id: string; event_type: string; created_at: string };
  const byBooking = new Map<string, EvRow[]>();
  for (const row of (assignmentEvents.data ?? []) as EvRow[]) {
    const list = byBooking.get(row.booking_id) ?? [];
    list.push(row);
    byBooking.set(row.booking_id, list);
  }

  const delaysMs: number[] = [];
  for (const [, evs] of byBooking) {
    let paymentAt: string | null = null;
    let assignedAt: string | null = null;
    for (const e of evs) {
      if (e.event_type === "PAYMENT_RECEIVED" && !paymentAt) {
        paymentAt = e.created_at;
      }
      if (e.event_type === "BOOKING_ASSIGNED" && paymentAt && !assignedAt) {
        if (new Date(e.created_at) >= new Date(paymentAt)) {
          assignedAt = e.created_at;
        }
      }
    }
    if (paymentAt && assignedAt) {
      delaysMs.push(new Date(assignedAt).getTime() - new Date(paymentAt).getTime());
    }
  }
  const delaysHours = delaysMs.map((ms) => ms / 3600000);

  const completionHours: number[] = [];
  for (const row of (completedRows.data ?? []) as {
    scheduled_start: string;
    completed_at: string;
    cleaner_id: string | null;
  }[]) {
    completionHours.push(
      (new Date(row.completed_at).getTime() - new Date(row.scheduled_start).getTime()) / 3600000,
    );
  }

  const lifecycle = {
    avg_assignment_delay_hours: mean(delaysHours),
    median_assignment_delay_hours: median(delaysHours),
    assignment_sample_size: delaysHours.length,
    avg_completion_vs_scheduled_hours: mean(completionHours),
    completion_sample_size: completionHours.length,
  };

  const notifDenom =
    (sentOutboxWin.count ?? 0) + (failedOutboxWin.count ?? 0) + (skippedOutboxWin.count ?? 0);

  const cleanerCompleted = new Map<string, number>();
  const cleanerCancelled = new Map<string, number>();

  const { data: compRows, error: compRowsErr } = await client
    .from("bookings")
    .select("cleaner_id")
    .eq("status", "completed")
    .not("cleaner_id", "is", null)
    .gte("completed_at", funnelStart)
    .limit(2500);
  if (compRowsErr) {
    return {
      ok: false,
      message: `bookings cleaner leaderboard (completed): ${describeQueryFailure(compRowsErr)}`,
    };
  }

  for (const r of (compRows ?? []) as { cleaner_id: string }[]) {
    cleanerCompleted.set(r.cleaner_id, (cleanerCompleted.get(r.cleaner_id) ?? 0) + 1);
  }

  const { data: canRows, error: canRowsErr } = await client
    .from("bookings")
    .select("cleaner_id")
    .eq("status", "cancelled")
    .not("cleaner_id", "is", null)
    .gte("updated_at", funnelStart)
    .limit(2500);
  if (canRowsErr) {
    return {
      ok: false,
      message: `bookings cleaner leaderboard (cancelled): ${describeQueryFailure(canRowsErr)}`,
    };
  }

  for (const r of (canRows ?? []) as { cleaner_id: string }[]) {
    cleanerCancelled.set(r.cleaner_id, (cleanerCancelled.get(r.cleaner_id) ?? 0) + 1);
  }

  const leaderIds = [...cleanerCompleted.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, ANALYTICS_DEFAULTS.TOP_CLEANERS_LIMIT)
    .map(([id]) => id);

  let names = new Map<string, string | null>();
  if (leaderIds.length > 0) {
    const { data: usersRows, error: usersErr } = await client
      .from("users")
      .select("id, display_name")
      .in("id", leaderIds);
    if (usersErr) {
      return {
        ok: false,
        message: `users cleaner display names: ${describeQueryFailure(usersErr)}`,
      };
    }
    if (usersRows) {
      names = new Map(
        (usersRows as { id: string; display_name: string | null }[]).map((u) => [
          u.id,
          u.display_name,
        ]),
      );
    }
  }

  const leaderboard = leaderIds.map((cid) => ({
    cleaner_id: cid,
    display_name: names.get(cid) ?? null,
    completed_jobs: cleanerCompleted.get(cid) ?? 0,
    cancelled_jobs: cleanerCancelled.get(cid) ?? 0,
  }));

  const repeatRows = (repeatCompletionRows.data ?? []) as { customer_id: string }[];
  const byCustomerCompletions = new Map<string, number>();
  for (const row of repeatRows) {
    byCustomerCompletions.set(row.customer_id, (byCustomerCompletions.get(row.customer_id) ?? 0) + 1);
  }
  let customers_completed_once = 0;
  let customers_completed_repeat = 0;
  for (const n of byCustomerCompletions.values()) {
    if (n === 1) customers_completed_once += 1;
    else customers_completed_repeat += 1;
  }
  const customersCompleting = customers_completed_once + customers_completed_repeat;
  const org_repeat_completions = {
    completed_bookings_in_window: repeatRows.length,
    customers_completed_once,
    customers_completed_repeat,
    repeat_share_among_completing_customers:
      customersCompleting > 0 ? customers_completed_repeat / customersCompleting : null,
  };

  const active_cleaners = activeCleanersRes.count ?? 0;
  const cleaners_with_completed_in_window = cleanerCompleted.size;
  const utilization = {
    active_cleaners,
    cleaners_with_completed_in_window,
    utilization_rate:
      active_cleaners > 0 ? cleaners_with_completed_in_window / active_cleaners : null,
  };

  const base: Omit<AdminAnalyticsSnapshot, "sla_surfaces"> = {
    generated_at: new Date().toISOString(),
    funnel_window_days: funnelDays,
    trend_days: trendDays,
    daily_bookings_created,
    daily_payment_received_events,
    payments,
    funnel,
    lifecycle,
    reconciliation: {
      divergent_payment_rows: recon.rows.length,
    },
    notifications: {
      pending: pendingOutbox.count ?? 0,
      processing: processingOutbox.count ?? 0,
      failed: failedOutbox.count ?? 0,
      sent_in_window: sentOutboxWin.count ?? 0,
      skipped_in_window: skippedOutboxWin.count ?? 0,
      failure_rate: notifDenom > 0 ? (failedOutboxWin.count ?? 0) / notifDenom : null,
    },
    ops_health: {
      stuck_awaiting_payment_48h: stuckAwait48.count ?? 0,
      stuck_assigned_72h: stuckAssign72.count ?? 0,
      in_progress_stale_24h: inProgStale.count ?? 0,
      awaiting_payment_stale_24h: awaitStale24.count ?? 0,
    },
    cleaners: {
      leaderboard,
      utilization,
    },
    capacity_pressure: {
      needs_assignment: needsAssignCap.count ?? 0,
      active_field_pipeline: activeFieldCap.count ?? 0,
    },
    org_repeat_completions,
    data_gaps: [
      "Webhook verification latency is not persisted in Postgres — instrument Paystack route / log drain for p95 latency.",
      "Draft → paid conversion uses bookings created in-window that reached paid+ operational statuses (not single-session cohort).",
      "Analytics uses bounded scans — very high volume should move to scheduled rollups / warehouse.",
      ...(repeatRows.length >= 4000
        ? [
            "Repeat-completion customer counts may under-represent totals when the 4000-row sample limit is hit — prefer warehouse rollups at scale.",
          ]
        : []),
    ],
  };

  return {
    ok: true,
    snapshot: {
      ...base,
      sla_surfaces: buildSlaSurfaces(base),
    },
  };
}
