import "server-only";

import type { AdminAnalyticsSnapshot } from "@/lib/analytics/types";

/**
 * Stage 20 — Stewardship posture cues from the **current** analytics snapshot only.
 * Informational; complements operational learning without storing institutional memory in Postgres.
 */

export type StewardshipAttention = "steady" | "watch";

export type StewardshipPostureCue = {
  id: string;
  attention: StewardshipAttention;
  title: string;
  detail: string;
};

export function deriveStewardshipPostureCues(s: AdminAnalyticsSnapshot): StewardshipPostureCue[] {
  const cues: StewardshipPostureCue[] = [];

  const stallSum = s.ops_health.stuck_assigned_72h + s.ops_health.in_progress_stale_24h;
  const criticalSla = s.sla_surfaces.filter((x) => x.severity === "critical").length;
  const frictionScore =
    s.reconciliation.divergent_payment_rows +
    s.notifications.failed +
    stallSum +
    criticalSla * 2;

  if (s.data_gaps.length > 0) {
    cues.push({
      id: "data_gap_stewardship",
      attention: "watch",
      title: "Measurement stewardship",
      detail: `This snapshot carries ${s.data_gaps.length} data-gap note(s) — long-term clarity favors tightening reads before expanding narratives; booking_events remain the behavioral audit trail.`,
    });
  }

  if (frictionScore <= 2 && s.sla_surfaces.length === 0) {
    cues.push({
      id: "calm_posture",
      attention: "steady",
      title: "Calm production posture",
      detail:
        "Reconciliation, notifications, and field stalls look contained — steward trust by refreshing onboarding, export rhythm, and governance checklists instead of introducing churn.",
    });
  }

  if (frictionScore >= 8 || criticalSla >= 2) {
    cues.push({
      id: "continuity_under_load",
      attention: "watch",
      title: "Continuity under load",
      detail:
        "Friction is elevated — favor explicit playbooks, written rationale, and Monitoring drill-through over shortcuts that bypass lifecycle governance or RLS expectations.",
    });
  }

  const payDenom = s.payments.succeeded + s.payments.failed;
  if (
    s.funnel.bookings_created >= 25 &&
    s.payments.failed_rate !== null &&
    s.payments.failed_rate >= 0.12 &&
    payDenom >= 10
  ) {
    cues.push({
      id: "scaling_complexity_guardrail",
      attention: "watch",
      title: "Scaling-complexity guardrail",
      detail:
        "Higher intake with visible payment failure share — keep shared primitives and one reconciliation path as teams parallelize; resist per-team lifecycle forks or shadow dashboards.",
    });
  }

  cues.push({
    id: "institutional_memory",
    attention: "steady",
    title: "Institutional memory",
    detail:
      "Durable lessons and milestones belong in staged docs, DEPLOYMENT.md, and archived exports — rotating operators rely on those artifacts, not implicit schema knowledge.",
  });

  return cues;
}
