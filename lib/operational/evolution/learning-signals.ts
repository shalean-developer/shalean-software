import "server-only";

import type { AdminAnalyticsSnapshot } from "@/lib/analytics/types";

/**
 * Stage 19 — Interpretive “learning” cues from the **current** analytics snapshot only.
 * No time-series memory, no ML — operators synthesize patterns across sessions.
 */

export type OperationalLearningAttention = "info" | "attention";

export type OperationalLearningSignal = {
  id: string;
  attention: OperationalLearningAttention;
  title: string;
  detail: string;
};

export function deriveOperationalLearningSignals(s: AdminAnalyticsSnapshot): OperationalLearningSignal[] {
  const signals: OperationalLearningSignal[] = [];

  if (s.reconciliation.divergent_payment_rows >= 2) {
    signals.push({
      id: "recon_recurrence",
      attention: "attention",
      title: "Reconciliation recurrence",
      detail: `${s.reconciliation.divergent_payment_rows} divergent payment/booking rows in sample — if this keeps appearing across shifts, treat Paystack verification + healing transitions as a standing drill (document root causes in operational notes when known).`,
    });
  }

  const stallSum = s.ops_health.stuck_assigned_72h + s.ops_health.in_progress_stale_24h;
  if (stallSum >= 4) {
    signals.push({
      id: "field_recovery_pattern",
      attention: "attention",
      title: "Field recovery pattern",
      detail: `${stallSum} bookings past assigned / in-progress staleness thresholds — recurring playbook: confirm cleaner reality, then lifecycle moves; avoid skipping booking_events context.`,
    });
  }

  if (s.notifications.failed >= 5) {
    signals.push({
      id: "notification_terminal_cluster",
      attention: "attention",
      title: "Notification delivery cluster",
      detail: `${s.notifications.failed} outbox rows in failed state — recurring operational friction if customers chase status; inspect provider errors and worker cadence before scaling marketing sends.`,
    });
  }

  const payDenom = s.payments.succeeded + s.payments.failed;
  if (s.payments.failed_rate !== null && s.payments.failed_rate >= 0.22 && payDenom >= 8) {
    signals.push({
      id: "checkout_support_hotspot",
      attention: "attention",
      title: "Checkout / payment support hotspot",
      detail: `Terminal payment failure rate about ${Math.round(s.payments.failed_rate * 100)}% among ${payDenom} attempts — expect repeated support touches; pair with Monitoring payment rows.`,
    });
  }

  if (
    s.funnel.cancellation_rate !== null &&
    s.funnel.bookings_created >= 10 &&
    s.funnel.cancellation_rate >= 0.22
  ) {
    signals.push({
      id: "cancellation_shape",
      attention: "info",
      title: "Cancellation shape",
      detail: `Roughly ${Math.round(s.funnel.cancellation_rate * 100)}% of created bookings cancelled in-window — interpret demand/policy; central lifecycle remains authoritative.`,
    });
  }

  const criticalSla = s.sla_surfaces.filter((x) => x.severity === "critical").length;
  if (criticalSla >= 2) {
    signals.push({
      id: "multi_critical_posture",
      attention: "attention",
      title: "Incident-style posture",
      detail: `${criticalSla} critical SLA surfaces simultaneously — good moment for a short governance/reliability huddle; still no autonomous remediation.`,
    });
  }

  if (
    s.capacity_pressure.needs_assignment >= 6 &&
    s.cleaners.utilization.utilization_rate !== null &&
    s.cleaners.utilization.utilization_rate >= 0.75
  ) {
    signals.push({
      id: "coordination_pressure",
      attention: "info",
      title: "Coordination pressure",
      detail: "High paid-unassigned depth alongside strong cleaner utilization suggests dispatcher throughput or geography coordination limits — consider roster/regional guidance before adding tenants.",
    });
  }

  signals.push({
    id: "evolution_discipline",
    attention: "info",
    title: "Evolution discipline",
    detail:
      "Learning is cumulative judgment — snapshots reset each load; capture durable lessons in operational notes, DEPLOYMENT.md changes, and staged governance docs instead of new operational databases.",
  });

  return signals;
}
