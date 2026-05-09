import type { GlobalOrchestrationEventInput, GlobalOrchestrationSeverity } from "./global-orchestration-events";

function severityFromPressure(score: number): GlobalOrchestrationSeverity {
  if (score >= 0.9) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "normal";
  return "low";
}

export function evaluateFailoverGovernance(input: {
  originRegion: string | null;
  targetRegion?: string | null;
  primaryRegion: string | null;
  regionalDegradation: number;
  providerInstability: number;
  queueSaturation: number;
  reconciliationLag: number;
  topologyFragmentation: number;
}): GlobalOrchestrationEventInput {
  const pressure = Math.min(
    1,
    input.regionalDegradation * 0.3 +
      input.providerInstability * 0.2 +
      input.queueSaturation * 0.2 +
      input.reconciliationLag * 0.2 +
      input.topologyFragmentation * 0.1,
  );
  const severity = severityFromPressure(pressure);
  const reviewRequired = pressure >= 0.55;

  return {
    kind: "failover_recommendation",
    status: reviewRequired ? "review_required" : "observing",
    severity,
    origin_region: input.originRegion,
    target_region: input.targetRegion ?? input.primaryRegion,
    primary_region: input.primaryRegion,
    entity_kind: "region",
    entity_id: input.originRegion,
    booking_id: null,
    assignment_id: null,
    cleaner_id: null,
    payment_id: null,
    title: "Governed failover posture",
    summary: reviewRequired
      ? "Regional pressure suggests failover review, but ownership must remain governed."
      : "Regional pressure is observable and does not require failover review yet.",
    governance_action: reviewRequired
      ? "Review failover readiness with an admin or dispatcher before moving operational ownership."
      : "Continue monitoring global orchestration posture.",
    reasoning: [
      `Regional degradation score: ${input.regionalDegradation}.`,
      `Provider instability score: ${input.providerInstability}.`,
      `Queue saturation score: ${input.queueSaturation}.`,
      `Reconciliation lag score: ${input.reconciliationLag}.`,
      `Topology fragmentation score: ${input.topologyFragmentation}.`,
    ],
    source_refs: ["scale_readiness_events", "production_monitor", "realtime_recovery"],
    recommendations: reviewRequired
      ? ["Confirm primary-region health, drain queues, and verify realtime reconciliation before failover."]
      : [],
    metadata: { pressure },
  };
}
