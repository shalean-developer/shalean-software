import "server-only";

import type { AdminAnalyticsSnapshot } from "./types";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(metric: string, value: string | number | null | undefined): string {
  const v = value === null || value === undefined ? "" : String(value);
  return `${csvEscape(metric)},${csvEscape(v)}`;
}

/**
 * Flat CSV suitable for spreadsheets — one metric per row; series folded as JSON strings when needed.
 */
export function analyticsSnapshotToCsv(s: AdminAnalyticsSnapshot): string {
  const lines: string[] = ["metric,value"];
  lines.push(row("generated_at", s.generated_at));
  lines.push(row("funnel_window_days", s.funnel_window_days));
  lines.push(row("trend_days", s.trend_days));
  lines.push(row("funnel.bookings_created", s.funnel.bookings_created));
  lines.push(row("funnel.reached_paid_pipeline", s.funnel.reached_paid_pipeline));
  lines.push(row("funnel.draft_to_paid_pipeline_rate", s.funnel.draft_to_paid_pipeline_rate));
  lines.push(row("funnel.cancelled", s.funnel.cancelled));
  lines.push(row("funnel.cancellation_rate", s.funnel.cancellation_rate));
  lines.push(row("payments.attempts", s.payments.attempts));
  lines.push(row("payments.failed_rate", s.payments.failed_rate));
  lines.push(row("capacity.needs_assignment", s.capacity_pressure.needs_assignment));
  lines.push(row("capacity.active_field_pipeline", s.capacity_pressure.active_field_pipeline));
  lines.push(row("notifications.pending", s.notifications.pending));
  lines.push(row("notifications.processing", s.notifications.processing));
  lines.push(row("notifications.failed", s.notifications.failed));
  lines.push(row("notifications.failure_rate", s.notifications.failure_rate));
  lines.push(row("reconciliation.divergent_payment_rows", s.reconciliation.divergent_payment_rows));
  lines.push(row("ops.stuck_awaiting_payment_48h", s.ops_health.stuck_awaiting_payment_48h));
  lines.push(row("ops.stuck_assigned_72h", s.ops_health.stuck_assigned_72h));
  lines.push(row("ops.in_progress_stale_24h", s.ops_health.in_progress_stale_24h));
  lines.push(row("cleaners.utilization_rate", s.cleaners.utilization.utilization_rate));
  lines.push(row("retention.repeat_share_completing_customers", s.org_repeat_completions.repeat_share_among_completing_customers));
  lines.push(row("daily_bookings_created_json", JSON.stringify(s.daily_bookings_created)));
  lines.push(row("daily_payment_received_events_json", JSON.stringify(s.daily_payment_received_events)));
  lines.push(row("sla_surfaces_json", JSON.stringify(s.sla_surfaces)));
  return lines.join("\n") + "\n";
}
