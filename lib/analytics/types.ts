/** Derived analytics snapshot — all metrics computed from operational tables (no duplicate truth). */

export type DailyCount = {
  /** UTC calendar date YYYY-MM-DD */
  date: string;
  count: number;
};

export type PaymentWindowStats = {
  attempts: number;
  succeeded: number;
  failed: number;
  /** failed / (succeeded + failed), null if denominator zero */
  failed_rate: number | null;
};

export type FunnelStats = {
  bookings_created: number;
  /** Bookings that reached operational execution (paid onward). */
  reached_paid_pipeline: number;
  draft_to_paid_pipeline_rate: number | null;
  cancelled: number;
  cancellation_rate: number | null;
};

export type LifecycleSampleStats = {
  /** PAYMENT_RECEIVED → BOOKING_ASSIGNED (from booking_events), hours */
  avg_assignment_delay_hours: number | null;
  median_assignment_delay_hours: number | null;
  assignment_sample_size: number;
  /** Bookings.completed_at − scheduled_start for status=completed, hours */
  avg_completion_vs_scheduled_hours: number | null;
  completion_sample_size: number;
};

export type ReconciliationAnalytics = {
  divergent_payment_rows: number;
};

export type NotificationOutboxAnalytics = {
  pending: number;
  processing: number;
  failed: number;
  sent_in_window: number;
  skipped_in_window: number;
  /** failed / (sent + failed + skipped terminal) in window — coarse signal */
  failure_rate: number | null;
};

export type OpsHealthCounts = {
  stuck_awaiting_payment_48h: number;
  stuck_assigned_72h: number;
  in_progress_stale_24h: number;
  awaiting_payment_stale_24h: number;
};

export type CleanerLeaderRow = {
  cleaner_id: string;
  display_name: string | null;
  completed_jobs: number;
  cancelled_jobs: number;
};

export type SlaSurfaceFlag = {
  id: string;
  severity: "warning" | "critical";
  label: string;
};

export type CleanerUtilization = {
  active_cleaners: number;
  cleaners_with_completed_in_window: number;
  utilization_rate: number | null;
};

/** Assignment and field pipeline pressure — same predicates as dispatcher queue strip. */
export type CapacityPressureStats = {
  needs_assignment: number;
  active_field_pipeline: number;
};

/**
 * Repeat completion signal in funnel window — bounded scan; not a CRM duplicate store.
 */
export type OrgRepeatCompletionStats = {
  completed_bookings_in_window: number;
  customers_completed_once: number;
  customers_completed_repeat: number;
  repeat_share_among_completing_customers: number | null;
};

export type AdminAnalyticsSnapshot = {
  generated_at: string;
  funnel_window_days: number;
  trend_days: number;
  daily_bookings_created: DailyCount[];
  daily_payment_received_events: DailyCount[];
  payments: PaymentWindowStats;
  funnel: FunnelStats;
  lifecycle: LifecycleSampleStats;
  reconciliation: ReconciliationAnalytics;
  notifications: NotificationOutboxAnalytics;
  ops_health: OpsHealthCounts;
  cleaners: {
    leaderboard: CleanerLeaderRow[];
    utilization: CleanerUtilization;
  };
  capacity_pressure: CapacityPressureStats;
  org_repeat_completions: OrgRepeatCompletionStats;
  sla_surfaces: SlaSurfaceFlag[];
  /** Not stored in DB today — surfaced as advisory only */
  data_gaps: string[];
};
