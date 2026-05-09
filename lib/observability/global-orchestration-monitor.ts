import type {
  GlobalOrchestrationKind,
  GlobalOrchestrationSeverity,
  GlobalOrchestrationStatus,
} from "@/lib/global-orchestration/global-orchestration-events";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("global-orchestration");

export function recordGlobalOrchestrationSignal(params: {
  kind: GlobalOrchestrationKind;
  status: GlobalOrchestrationStatus;
  severity: GlobalOrchestrationSeverity;
  originRegion?: string | null;
  targetRegion?: string | null;
  reasoningCount: number;
}): void {
  const payload = { event: "global_orchestration.signal", ...params };
  if (params.severity === "critical" || params.status === "blocked") {
    logger.error(payload);
    recordProductionSignal({
      area: "global_orchestration",
      status: "failed",
      message: "Global orchestration reported blocked federation posture.",
      metadata: params,
    });
  } else if (params.severity === "high" || params.status === "review_required") {
    logger.warn(payload);
    recordProductionSignal({
      area: "global_orchestration",
      status: "degraded",
      message: "Global orchestration requires governance review.",
      metadata: params,
    });
  } else {
    logger.info(payload);
  }
}

export function recordFederationDrift(params: {
  originRegion?: string | null;
  targetRegion?: string | null;
  lagMs: number;
  thresholdMs: number;
}): void {
  const drifted = params.lagMs > params.thresholdMs;
  logger[drifted ? "warn" : "info"]({
    event: "global_orchestration.drift",
    ...params,
    drifted,
  });
}
