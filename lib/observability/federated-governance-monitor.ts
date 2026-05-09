import type {
  FederatedGovernanceKind,
  FederatedGovernanceSeverity,
  FederatedGovernanceStatus,
} from "@/lib/federated-governance/federated-governance-events";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("federated-governance");

export function recordFederatedGovernanceSignal(params: {
  kind: FederatedGovernanceKind;
  status: FederatedGovernanceStatus;
  severity: FederatedGovernanceSeverity;
  trustScore: number;
  driftScore: number;
  policyIntegrityScore: number;
  region?: string | null;
  domain: string;
  blocked: boolean;
  safetyFlagCount: number;
}): void {
  const payload = { event: "federated_governance.signal", ...params };
  if (params.blocked || params.severity === "critical") {
    logger.error(payload);
    recordProductionSignal({
      area: "federated_governance",
      status: params.blocked ? "failed" : "degraded",
      message: params.blocked
        ? "Federated governance guardrails blocked unsafe governance guidance."
        : "Critical governance drift requires review.",
      metadata: params,
    });
  } else if (params.severity === "high" || params.status === "review_required") {
    logger.warn(payload);
    recordProductionSignal({
      area: "federated_governance",
      status: "degraded",
      message: "Federated governance recommends policy review.",
      metadata: params,
    });
  } else {
    logger.info(payload);
  }
}

export function recordGovernanceTrustDrift(params: {
  kind: FederatedGovernanceKind;
  previousTrust: number;
  nextTrust: number;
  threshold: number;
}): void {
  const delta = Math.abs(params.nextTrust - params.previousTrust);
  logger[delta >= params.threshold ? "warn" : "info"]({
    event: "federated_governance.trust_drift",
    ...params,
    delta,
  });
}
