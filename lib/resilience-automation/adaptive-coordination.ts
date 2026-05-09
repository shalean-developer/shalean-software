import { automationFromSignals, type NormalizedResilienceAutomation } from "./stabilization-normalizers";

export function coordinateAdaptiveRecovery(input: {
  retryDensity: number;
  queuePressure: number;
  reconciliationLag: number;
  staleSubscriptionRatio: number;
  region?: string | null;
  provider?: string | null;
  entityKind?: string;
  entityId?: string | null;
}): NormalizedResilienceAutomation {
  return automationFromSignals({
    kind: "adaptive_recovery_sequence",
    title: "Adaptive recovery sequencing",
    summary: "Recovery sequence guidance based on retry density, queue pressure, lag, and stale subscriptions.",
    automationGuidance: "Sequence recovery in governed batches; do not restart all channels or workers simultaneously.",
    sequenceSteps: [
      "Stabilize realtime subscriptions with bounded reconnect pacing.",
      "Prioritize reconciliation for freshest operational entities.",
      "Drain queue pressure before expanding retry concurrency.",
      "Escalate to dispatcher/admin review if pressure continues rising.",
    ],
    throttlingGuidance: [
      "Use short pacing windows for low pressure and longer windows as congestion rises.",
      "Avoid parallel retries for the same entity until reconciliation confirms freshness.",
    ],
    region: input.region,
    provider: input.provider,
    entityKind: input.entityKind ?? "operational_resilience",
    entityId: input.entityId,
    signals: [
      {
        source: "queue",
        score: input.retryDensity,
        weight: 0.25,
        explanation: `Retry density score is ${input.retryDensity}.`,
        sourceRef: "retry_engine",
      },
      {
        source: "queue",
        score: input.queuePressure,
        weight: 0.3,
        explanation: `Queue pressure score is ${input.queuePressure}.`,
        sourceRef: "queue_health",
      },
      {
        source: "realtime",
        score: input.reconciliationLag,
        weight: 0.25,
        explanation: `Reconciliation lag score is ${input.reconciliationLag}.`,
        sourceRef: "realtime_reconciliation",
      },
      {
        source: "realtime",
        score: input.staleSubscriptionRatio,
        weight: 0.2,
        explanation: `Stale subscription ratio is ${input.staleSubscriptionRatio}.`,
        sourceRef: "realtime_recovery",
      },
    ],
  });
}

export function coordinateReconciliationThrottling(input: {
  eventBacklog: number;
  activeSubscriptions: number;
  lagScore: number;
  region?: string | null;
}): NormalizedResilienceAutomation {
  const subscriptionPressure =
    input.activeSubscriptions <= 0 ? 1 : Math.min(1, input.eventBacklog / (input.activeSubscriptions * 50));
  return automationFromSignals({
    kind: "reconciliation_throttling",
    title: "Adaptive reconciliation throttling",
    summary: "Pacing guidance for event backlog reconciliation while preserving canonical workflow freshness.",
    automationGuidance: "Throttle reconciliation by priority class; keep lifecycle and assignment events ahead of advisory signals.",
    sequenceSteps: [
      "Reconcile lifecycle and assignment events first.",
      "Then reconcile financial and notification state.",
      "Defer advisory intelligence refresh until canonical state is fresh.",
    ],
    throttlingGuidance: [
      "Increase pacing window when backlog per active subscription rises.",
      "Do not suppress events invisibly; record any deferred advisory stream.",
    ],
    region: input.region,
    entityKind: "realtime_reconciliation",
    signals: [
      {
        source: "realtime",
        score: subscriptionPressure,
        weight: 0.55,
        explanation: `Backlog per active subscription pressure is ${subscriptionPressure}.`,
        sourceRef: "realtime_fanout",
      },
      {
        source: "realtime",
        score: input.lagScore,
        weight: 0.45,
        explanation: `Reconciliation lag score is ${input.lagScore}.`,
        sourceRef: "consistency_lag",
      },
    ],
  });
}
