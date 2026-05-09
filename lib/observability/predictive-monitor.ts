import type { PredictionKind, PredictionSeverity, PredictionStatus } from "@/lib/predictive/prediction-normalizers";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("predictive");

export function recordPrediction(params: {
  kind: PredictionKind;
  status: PredictionStatus;
  severity: PredictionSeverity;
  confidence: number;
  probability: number;
  blocked: boolean;
  safetyFlagCount: number;
}): void {
  logger[params.blocked || params.severity === "critical" ? "warn" : "info"]({
    event: "predictive.forecast",
    ...params,
  });

  if (params.blocked) {
    recordProductionSignal({
      area: "workflow",
      status: "degraded",
      message: "Predictive guardrail blocked a forecast.",
      metadata: params,
    });
  }
}

export function recordPredictionDrift(params: {
  kind: PredictionKind;
  previousProbability: number;
  nextProbability: number;
  threshold: number;
}): void {
  const delta = Math.abs(params.nextProbability - params.previousProbability);
  logger[delta >= params.threshold ? "warn" : "info"]({
    event: "predictive.drift",
    ...params,
    delta,
  });
}
