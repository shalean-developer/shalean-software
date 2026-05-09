/**
 * SLA-style thresholds for Stage 15A surfaces.
 * Tune per market; exported for dashboards and future alerting jobs.
 */

export const ANALYTICS_DEFAULTS = {
  FUNNEL_WINDOW_DAYS: 7,
  TREND_DAYS: 14,
  PAYMENT_EVENTS_SAMPLE_LIMIT: 4000,
  ASSIGNMENT_DELAY_SAMPLE_LIMIT: 3500,
  COMPLETED_BOOKINGS_SAMPLE_LIMIT: 400,
  TOP_CLEANERS_LIMIT: 12,
  /**
   * Parallel UTC-day head queries per batch — caps burst concurrency against the pool
   * while preserving exact counts (Stage 17 throughput hygiene).
   */
  HEAD_QUERY_CONCURRENCY: 6,
} as const;

/** Stuck / aging cutoffs (align with monitoring-reads where sensible). */
export const OPS_THRESHOLDS = {
  AWAITING_PAYMENT_STUCK_HOURS: 48,
  ASSIGNED_STUCK_HOURS: 72,
  AWAITING_PAYMENT_WARN_HOURS: 24,
  IN_PROGRESS_STALE_HOURS: 24,
} as const;

/** Recommended alert routing / thresholds for log-based alerting (Datadog etc.). */
export const ALERT_RECOMMENDATIONS = [
  {
    id: "reconciliation_divergence",
    metric: "reconciliation_divergent_payment_rows",
    warning: ">= 1 sustained 15m",
    critical: ">= 5 or growth hour-over-hour",
    route: "payments + ops channel",
  },
  {
    id: "notification_outbox_failed",
    metric: "notification_outbox.status=failed count",
    warning: ">= 3 in 24h",
    critical: ">= 10 or repeated same dedupe_key",
    route: "eng + ops",
  },
  {
    id: "awaiting_payment_age",
    metric: "bookings.awaiting_payment updated_at",
    warning: `> ${OPS_THRESHOLDS.AWAITING_PAYMENT_WARN_HOURS}h`,
    critical: `> ${OPS_THRESHOLDS.AWAITING_PAYMENT_STUCK_HOURS}h`,
    route: "support queue",
  },
  {
    id: "in_progress_stall",
    metric: "bookings.in_progress updated_at",
    warning: `> ${OPS_THRESHOLDS.IN_PROGRESS_STALE_HOURS}h`,
    critical: "> 48h",
    route: "dispatcher",
  },
  {
    id: "payment_failure_spike",
    metric: "payments.failed / (failed+succeeded) rolling 24h",
    warning: "> 15%",
    critical: "> 35%",
    route: "payments channel",
  },
  {
    id: "webhook_latency",
    metric: "paystack webhook processing (not persisted)",
    warning: "p95 > 3s in log drain",
    critical: "p95 > 10s or error rate > 1%",
    route: "emit from route handler metrics middleware when added",
  },
] as const;
