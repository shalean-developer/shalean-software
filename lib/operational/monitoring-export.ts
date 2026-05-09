import "server-only";

import type { OperationalMonitoringSnapshot } from "./monitoring-reads";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(metric: string, value: string | number): string {
  return `${csvEscape(metric)},${csvEscape(String(value))}`;
}

/** Summary CSV — drill-down samples remain in JSON export. */
export function monitoringSnapshotToCsv(s: OperationalMonitoringSnapshot): string {
  const c = s.counts;
  const lines: string[] = ["metric,value"];
  lines.push(row("generated_at", s.generated_at));
  lines.push(row("reconciliation_divergent_rows", c.reconciliation_divergent_rows));
  lines.push(row("stuck_awaiting_payment_list_len", c.stuck_awaiting_payment));
  lines.push(row("stuck_assigned_list_len", c.stuck_assigned));
  lines.push(row("stale_in_progress_list_len", c.stale_in_progress));
  lines.push(row("recent_failed_payments_list_len", c.recent_failed_payments));
  lines.push(row("notification_outbox_failed", c.notification_outbox_failed));
  lines.push(row("notification_outbox_pending", c.notification_outbox_pending));
  lines.push(row("notification_outbox_processing", c.notification_outbox_processing));
  lines.push(row("notification_outbox_stale_processing", c.notification_outbox_stale_processing));
  return lines.join("\n") + "\n";
}
