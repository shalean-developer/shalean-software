import { safeguardFromSignals, type NormalizedOptimizationSafeguard } from "./optimization-normalizers";

export function evaluateOptimizationBoundaries(input: {
  optimizationBenefit: number;
  lifecycleRisk: number;
  topologyRisk: number;
  resilienceRisk: number;
  reconciliationRisk: number;
  region?: string | null;
  provider?: string | null;
  entityKind?: string;
  entityId?: string | null;
}): NormalizedOptimizationSafeguard {
  return safeguardFromSignals({
    kind: "boundary_evaluation",
    title: "Bounded optimization safeguard",
    summary: "Optimization evaluated against lifecycle, topology, resilience, and reconciliation boundaries.",
    safeguardGuidance:
      "Proceed only as an operator-approved optimization plan; do not mutate lifecycle, topology, or ownership automatically.",
    constraints: [
      "Lifecycle state remains owned by the canonical orchestration layer.",
      "Topology changes require global orchestration review.",
      "Reconciliation-sensitive optimizations must preserve workflow-store freshness.",
    ],
    rollbackGuidance: [
      "Preview rollback dependencies before accepting the optimization.",
      "Preserve the last known canonical workflow snapshot before changing operational configuration.",
    ],
    region: input.region,
    provider: input.provider,
    entityKind: input.entityKind ?? "optimization_boundary",
    entityId: input.entityId,
    signals: [
      {
        source: "analytics",
        optimizationScore: input.optimizationBenefit,
        riskScore: input.lifecycleRisk,
        integrityImpact: input.lifecycleRisk,
        weight: 0.3,
        explanation: `Lifecycle risk score is ${input.lifecycleRisk}.`,
        sourceRef: "lifecycle_contracts",
      },
      {
        source: "global_orchestration",
        optimizationScore: input.optimizationBenefit,
        riskScore: input.topologyRisk,
        integrityImpact: input.topologyRisk,
        weight: 0.25,
        explanation: `Topology risk score is ${input.topologyRisk}.`,
        sourceRef: "global_orchestration_events",
      },
      {
        source: "resilience_automation",
        optimizationScore: input.optimizationBenefit,
        riskScore: input.resilienceRisk,
        integrityImpact: input.resilienceRisk,
        weight: 0.25,
        explanation: `Resilience risk score is ${input.resilienceRisk}.`,
        sourceRef: "resilience_automation_events",
      },
      {
        source: "predictive",
        optimizationScore: input.optimizationBenefit,
        riskScore: input.reconciliationRisk,
        integrityImpact: input.reconciliationRisk,
        weight: 0.2,
        explanation: `Reconciliation risk score is ${input.reconciliationRisk}.`,
        sourceRef: "predictive_events",
      },
    ],
  });
}

export function coordinateOptimizationRollbackSafeguard(input: {
  optimizationRisk: number;
  rollbackComplexity: number;
  dependencyRisk: number;
  region?: string | null;
  entityKind?: string;
  entityId?: string | null;
}): NormalizedOptimizationSafeguard {
  return safeguardFromSignals({
    kind: "rollback_safeguard",
    title: "Optimization rollback safeguard",
    summary: "Rollback sequencing guidance for optimization changes that may affect resilience or reconciliation.",
    safeguardGuidance: "Prepare a human-approved rollback sequence before accepting the optimization.",
    constraints: [
      "No rollback is executed automatically.",
      "Rollback sequence must preserve audit and reconciliation history.",
      "Rollback readiness must be reviewed before optimization rollout.",
    ],
    rollbackGuidance: [
      "Verify dependency order before rollback.",
      "Reconcile active event streams before reverting optimization configuration.",
      "Confirm operational dashboards reflect canonical state after rollback.",
    ],
    region: input.region,
    entityKind: input.entityKind ?? "optimization_rollback",
    entityId: input.entityId,
    signals: [
      {
        source: "resilience_automation",
        optimizationScore: 0.5,
        riskScore: input.optimizationRisk,
        integrityImpact: input.optimizationRisk,
        weight: 0.4,
        explanation: `Optimization risk score is ${input.optimizationRisk}.`,
        sourceRef: "resilience_automation_events",
      },
      {
        source: "global_orchestration",
        optimizationScore: 0.5,
        riskScore: input.rollbackComplexity,
        integrityImpact: input.rollbackComplexity,
        weight: 0.35,
        explanation: `Rollback complexity score is ${input.rollbackComplexity}.`,
        sourceRef: "global_orchestration_events",
      },
      {
        source: "analytics",
        optimizationScore: 0.5,
        riskScore: input.dependencyRisk,
        integrityImpact: input.dependencyRisk,
        weight: 0.25,
        explanation: `Dependency risk score is ${input.dependencyRisk}.`,
        sourceRef: "analytics_events",
      },
    ],
  });
}
