import type {
  RecoveryKind,
  RecoverySeverity,
  RecoveryStatus,
} from "@/lib/self-healing/self-healing-events";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("self-healing");

export function recordSelfHealingSignal(params: {
  kind: RecoveryKind;
  status: RecoveryStatus;
  severity: RecoverySeverity;
  degradationScore: number;
  confidence: number;
  region?: string | null;
  provider?: string | null;
  blocked: boolean;
  safetyFlagCount: number;
}): void {
  const payload = { event: "self_healing.signal", ...params };
  if (params.blocked || params.severity === "critical") {
    logger.error(payload);
    recordProductionSignal({
      area: "self_healing",
      status: params.blocked ? "failed" : "degraded",
      message: params.blocked
        ? "Self-healing guardrails blocked a recovery recommendation."
        : "Critical degradation requires governed recovery review.",
      metadata: params,
    });
  } else if (params.severity === "high" || params.status === "review_required") {
    logger.warn(payload);
    recordProductionSignal({
      area: "self_healing",
      status: "degraded",
      message: "Self-healing recommends governed recovery review.",
      metadata: params,
    });
  } else {
    logger.info(payload);
  }
}

export function recordResilienceDrift(params: {
  kind: RecoveryKind;
  previousScore: number;
  nextScore: number;
  threshold: number;
}): void {
  const delta = Math.abs(params.nextScore - params.previousScore);
  logger[delta >= params.threshold ? "warn" : "info"]({
    event: "self_healing.drift",
    ...params,
    delta,
  });
}
