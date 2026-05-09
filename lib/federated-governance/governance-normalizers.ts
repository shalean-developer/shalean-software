import type {
  FederatedGovernanceKind,
  FederatedGovernanceSeverity,
} from "./federated-governance-events";

export type GovernanceSignal = {
  source:
    | "optimization_safeguard"
    | "predictive"
    | "global_orchestration"
    | "resilience_automation"
    | "workforce"
    | "audit";
  trustScore: number;
  driftScore: number;
  policyImpact: number;
  weight: number;
  explanation: string;
  sourceRef: string;
};

export type NormalizedFederatedGovernance = {
  kind: FederatedGovernanceKind;
  severity: FederatedGovernanceSeverity;
  trustScore: number;
  driftScore: number;
  policyIntegrityScore: number;
  confidence: number;
  region?: string | null;
  domain: string;
  entityKind: string;
  entityId?: string | null;
  optimizationSafeguardEventId?: string | null;
  predictiveEventId?: string | null;
  globalOrchestrationEventId?: string | null;
  title: string;
  summary: string;
  governanceGuidance: string;
  policyConstraints: string[];
  overrideGuidance: string[];
  reasoning: string[];
  safetyFlags: string[];
  sourceRefs: string[];
};

export function normalizeGovernanceScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(Math.max(value, 0), 1) * 100) / 100;
}

export function governanceSeverityFromDrift(drift: number): FederatedGovernanceSeverity {
  const score = normalizeGovernanceScore(drift);
  if (score >= 0.9) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "normal";
  return "low";
}

export function normalizeFederatedGovernance(
  governance: NormalizedFederatedGovernance,
): NormalizedFederatedGovernance {
  return {
    ...governance,
    trustScore: normalizeGovernanceScore(governance.trustScore),
    driftScore: normalizeGovernanceScore(governance.driftScore),
    policyIntegrityScore: normalizeGovernanceScore(governance.policyIntegrityScore),
    confidence: normalizeGovernanceScore(governance.confidence),
    policyConstraints: governance.policyConstraints.slice(0, 10),
    overrideGuidance: governance.overrideGuidance.slice(0, 10),
    reasoning: governance.reasoning.slice(0, 10),
    sourceRefs: governance.sourceRefs.slice(0, 12),
  };
}

export function governanceFromSignals(input: {
  kind: FederatedGovernanceKind;
  title: string;
  summary: string;
  governanceGuidance: string;
  policyConstraints: string[];
  overrideGuidance: string[];
  signals: GovernanceSignal[];
  region?: string | null;
  domain: string;
  entityKind: string;
  entityId?: string | null;
}): NormalizedFederatedGovernance {
  const totalWeight = input.signals.reduce((sum, signal) => sum + signal.weight, 0);
  const weighted = (select: (signal: GovernanceSignal) => number) =>
    totalWeight > 0
      ? normalizeGovernanceScore(
          input.signals.reduce((sum, signal) => sum + select(signal) * signal.weight, 0) /
            totalWeight,
        )
      : 0;
  const driftScore = weighted((signal) => signal.driftScore);
  return normalizeFederatedGovernance({
    kind: input.kind,
    severity: governanceSeverityFromDrift(driftScore),
    trustScore: weighted((signal) => signal.trustScore),
    driftScore,
    policyIntegrityScore: normalizeGovernanceScore(1 - weighted((signal) => signal.policyImpact)),
    confidence: input.signals.length > 0 ? 0.78 : 0.35,
    region: input.region,
    domain: input.domain,
    entityKind: input.entityKind,
    entityId: input.entityId,
    title: input.title,
    summary: input.summary,
    governanceGuidance: input.governanceGuidance,
    policyConstraints: input.policyConstraints,
    overrideGuidance: input.overrideGuidance,
    reasoning: input.signals.map((signal) => signal.explanation),
    safetyFlags: [],
    sourceRefs: Array.from(new Set(input.signals.map((signal) => signal.sourceRef))),
  });
}
