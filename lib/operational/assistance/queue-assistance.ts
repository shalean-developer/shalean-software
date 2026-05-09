import type { DispatcherQueueCounts } from "@/lib/admin/operations/dispatcher-queue-shared";

import type { OperationalHint } from "./types";

const SEVERITY_ORDER: Record<OperationalHint["severity"], number> = {
  priority: 0,
  attention: 1,
  info: 2,
};

/**
 * Board-level prioritization hints from live queue counts + reconciliation sample size.
 * Informational only — same thresholds family as monitoring/analytics.
 */
export function deriveQueueOperationalHints(
  counts: DispatcherQueueCounts,
  reconciliationDivergentRows: number,
): OperationalHint[] {
  const hints: OperationalHint[] = [];

  if (reconciliationDivergentRows >= 1) {
    hints.push({
      id: "recon_queue",
      severity: reconciliationDivergentRows >= 5 ? "priority" : "attention",
      category: "payment",
      title: "Payment / booking alignment queue",
      detail: `${reconciliationDivergentRows} divergent row(s) in scan — align before unrelated lifecycle moves.`,
    });
  }

  if (counts.needs_assignment >= 8) {
    hints.push({
      id: "assign_backlog",
      severity: counts.needs_assignment >= 15 ? "attention" : "info",
      category: "assignment",
      title: "Paid — unassigned volume",
      detail: `${counts.needs_assignment} paid bookings need cleaners — balance assignment pace with active field workload.`,
    });
  }

  if (counts.awaiting_payment_stuck_48h >= 5) {
    hints.push({
      id: "await_backlog",
      severity: "attention",
      category: "customer",
      title: "Multiple stale checkouts",
      detail: `${counts.awaiting_payment_stuck_48h} bookings idle over 48h in awaiting_payment.`,
    });
  }

  if (counts.stale_assigned_72h >= 4) {
    hints.push({
      id: "assigned_risk_cluster",
      severity: "attention",
      category: "assignment",
      title: "Cluster of stalled assignments",
      detail: `${counts.stale_assigned_72h} assigned bookings without progress past threshold — review field signals.`,
    });
  }

  if (counts.notification_outbox_failed >= 3) {
    hints.push({
      id: "notif_volume",
      severity: counts.notification_outbox_failed >= 10 ? "priority" : "attention",
      category: "recovery",
      title: "Notification failure volume",
      detail:
        "Failed notification_outbox rows are elevated — see Analytics notifications section; no automatic retries from this UI.",
    });
  }

  const pipe = counts.active_field_pipeline;
  const needs = counts.needs_assignment;
  if (pipe > needs * 4 && pipe >= 12) {
    hints.push({
      id: "workload_shape",
      severity: "info",
      category: "workload",
      title: "Field pipeline vs assignment backlog",
      detail:
        "Active field work is large relative to paid-unassigned backlog — informational workload shape only.",
    });
  }

  hints.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return hints;
}
