import { governanceFromSignals, type NormalizedFederatedGovernance } from "./governance-normalizers";

export function coordinateFederatedPolicy(input: {
  trustScore: number;
  policyDrift: number;
  topologyFragmentation: number;
  overrideInconsistency: number;
  region?: string | null;
  domain?: string;
  entityKind?: string;
  entityId?: string | null;
}): NormalizedFederatedGovernance {
  return governanceFromSignals({
    kind: "policy_coordination",
    title: "Federated policy coordination",
    summary: "Cross-domain governance mediation for distributed intelligence and operational policy consistency.",
    governanceGuidance:
      "Coordinate policy review through operators; do not enforce governance corrections automatically.",
    policyConstraints: [
      "Lifecycle semantics remain canonical across all domains.",
      "Policy harmonization must preserve audit and override history.",
      "Topology-aware policy differences require global orchestration review.",
    ],
    overrideGuidance: [
      "Validate human approval before accepting policy overrides.",
      "Reconcile conflicting overrides before updating governance posture.",
    ],
    region: input.region,
    domain: input.domain ?? "operations",
    entityKind: input.entityKind ?? "governance_policy",
    entityId: input.entityId,
    signals: [
      {
        source: "optimization_safeguard",
        trustScore: input.trustScore,
        driftScore: input.policyDrift,
        policyImpact: input.policyDrift,
        weight: 0.35,
        explanation: `Policy drift score is ${input.policyDrift}.`,
        sourceRef: "optimization_safeguard_events",
      },
      {
        source: "global_orchestration",
        trustScore: input.trustScore,
        driftScore: input.topologyFragmentation,
        policyImpact: input.topologyFragmentation,
        weight: 0.3,
        explanation: `Topology governance fragmentation score is ${input.topologyFragmentation}.`,
        sourceRef: "global_orchestration_events",
      },
      {
        source: "audit",
        trustScore: input.trustScore,
        driftScore: input.overrideInconsistency,
        policyImpact: input.overrideInconsistency,
        weight: 0.35,
        explanation: `Override inconsistency score is ${input.overrideInconsistency}.`,
        sourceRef: "operational_audit_events",
      },
    ],
  });
}

export function detectGovernanceDrift(input: {
  orchestrationDrift: number;
  reconciliationDrift: number;
  trustDegradation: number;
  overrideSaturation: number;
  region?: string | null;
  domain?: string;
}): NormalizedFederatedGovernance {
  return governanceFromSignals({
    kind: "governance_drift",
    title: "Governance drift detection",
    summary: "Advisory drift analysis across orchestration, reconciliation, trust, and override domains.",
    governanceGuidance: "Review governance drift with an admin before changing policy or operational authority.",
    policyConstraints: [
      "Do not suppress recommendations invisibly.",
      "Keep reconciliation and override policy evidence attached to review.",
    ],
    overrideGuidance: [
      "Sequence override review by highest drift and lowest trust.",
      "Reject conflicting override paths until policy evidence is reconciled.",
    ],
    region: input.region,
    domain: input.domain ?? "governance",
    entityKind: "governance_drift",
    signals: [
      {
        source: "global_orchestration",
        trustScore: 1 - input.trustDegradation,
        driftScore: input.orchestrationDrift,
        policyImpact: input.orchestrationDrift,
        weight: 0.3,
        explanation: `Orchestration drift score is ${input.orchestrationDrift}.`,
        sourceRef: "global_orchestration_events",
      },
      {
        source: "predictive",
        trustScore: 1 - input.trustDegradation,
        driftScore: input.reconciliationDrift,
        policyImpact: input.reconciliationDrift,
        weight: 0.25,
        explanation: `Reconciliation policy drift score is ${input.reconciliationDrift}.`,
        sourceRef: "predictive_events",
      },
      {
        source: "optimization_safeguard",
        trustScore: 1 - input.trustDegradation,
        driftScore: input.trustDegradation,
        policyImpact: input.trustDegradation,
        weight: 0.25,
        explanation: `Trust degradation score is ${input.trustDegradation}.`,
        sourceRef: "optimization_safeguard_events",
      },
      {
        source: "audit",
        trustScore: 1 - input.trustDegradation,
        driftScore: input.overrideSaturation,
        policyImpact: input.overrideSaturation,
        weight: 0.2,
        explanation: `Override saturation score is ${input.overrideSaturation}.`,
        sourceRef: "operational_audit_events",
      },
    ],
  });
}
