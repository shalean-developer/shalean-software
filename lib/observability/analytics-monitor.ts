import type { AnalyticsMetricKind } from "@/lib/analytics/operational-metrics";
import type { DecisionScoreKind } from "@/lib/analytics/optimization-signals";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("analytics");

export type AnalyticsComputationMetric = {
  metricKind?: AnalyticsMetricKind;
  scoreKind?: DecisionScoreKind;
  ok: boolean;
  latencyMs: number;
  stale?: boolean;
};

export function recordAnalyticsComputation(metric: AnalyticsComputationMetric): void {
  logger[metric.ok ? "info" : "error"]({
    event: "analytics.computation",
    ...metric,
  });

  if (!metric.ok || metric.stale || metric.latencyMs > 5_000) {
    recordProductionSignal({
      area: "workflow",
      status: metric.ok ? "degraded" : "failed",
      message: metric.ok
        ? "Analytics computation is stale or slow."
        : "Analytics computation failed.",
      metadata: metric,
    });
  }
}

export function recordScoringDrift(params: {
  scoreKind: DecisionScoreKind;
  previousScore: number;
  nextScore: number;
  threshold: number;
}): void {
  const delta = Math.abs(params.nextScore - params.previousScore);
  logger[delta >= params.threshold ? "warn" : "info"]({
    event: "analytics.scoring_drift",
    ...params,
    delta,
  });
}
