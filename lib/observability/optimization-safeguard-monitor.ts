import type {
  OptimizationSafeguardKind,
  OptimizationSafeguardSeverity,
  OptimizationSafeguardStatus,
} from "@/lib/optimization-safeguards/optimization-safeguard-events";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("optimization-safeguards");

export function recordOptimizationSafeguardSignal(params: {
  kind: OptimizationSafeguardKind;
  status: OptimizationSafeguardStatus;
  severity: OptimizationSafeguardSeverity;
  optimizationScore: number;
  riskScore: number;
  integrityScore: number;
  region?: string | null;
  provider?: string | null;
  blocked: boolean;
  safetyFlagCount: number;
}): void {
  const payload = { event: "optimization_safeguard.signal", ...params };
  if (params.blocked || params.severity === "critical") {
    logger.error(payload);
    recordProductionSignal({
      area: "optimization_safeguards",
      status: params.blocked ? "failed" : "degraded",
      message: params.blocked
        ? "Optimization safeguard blocked an unsafe optimization recommendation."
        : "Critical optimization risk requires governance review.",
      metadata: params,
    });
  } else if (params.severity === "high" || params.status === "review_required") {
    logger.warn(payload);
    recordProductionSignal({
      area: "optimization_safeguards",
      status: "degraded",
      message: "Optimization safeguard recommends governed review.",
      metadata: params,
    });
  } else {
    logger.info(payload);
  }
}

export function recordOptimizationIntegrityDrift(params: {
  kind: OptimizationSafeguardKind;
  previousIntegrity: number;
  nextIntegrity: number;
  threshold: number;
}): void {
  const delta = Math.abs(params.nextIntegrity - params.previousIntegrity);
  logger[delta >= params.threshold ? "warn" : "info"]({
    event: "optimization_safeguard.integrity_drift",
    ...params,
    delta,
  });
}
