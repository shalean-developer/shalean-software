import type {
  ResilienceAutomationKind,
  ResilienceAutomationSeverity,
  ResilienceAutomationStatus,
} from "@/lib/resilience-automation/resilience-automation-events";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("resilience-automation");

export function recordResilienceAutomationSignal(params: {
  kind: ResilienceAutomationKind;
  status: ResilienceAutomationStatus;
  severity: ResilienceAutomationSeverity;
  priorityScore: number;
  congestionScore: number;
  pacingWindowSeconds: number;
  region?: string | null;
  provider?: string | null;
  blocked: boolean;
  safetyFlagCount: number;
}): void {
  const payload = { event: "resilience_automation.signal", ...params };
  if (params.blocked || params.severity === "critical") {
    logger.error(payload);
    recordProductionSignal({
      area: "resilience_automation",
      status: params.blocked ? "failed" : "degraded",
      message: params.blocked
        ? "Resilience automation guardrails blocked adaptive coordination."
        : "Critical resilience automation recommendation requires governance review.",
      metadata: params,
    });
  } else if (params.severity === "high" || params.status === "review_required") {
    logger.warn(payload);
    recordProductionSignal({
      area: "resilience_automation",
      status: "degraded",
      message: "Resilience automation recommends governed review.",
      metadata: params,
    });
  } else {
    logger.info(payload);
  }
}

export function recordResilienceAutomationDrift(params: {
  kind: ResilienceAutomationKind;
  previousPriority: number;
  nextPriority: number;
  threshold: number;
}): void {
  const delta = Math.abs(params.nextPriority - params.previousPriority);
  logger[delta >= params.threshold ? "warn" : "info"]({
    event: "resilience_automation.drift",
    ...params,
    delta,
  });
}
