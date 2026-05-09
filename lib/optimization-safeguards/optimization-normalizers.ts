import type {
  OptimizationSafeguardKind,
  OptimizationSafeguardSeverity,
} from "./optimization-safeguard-events";

export type OptimizationSignal = {
  source: "analytics" | "predictive" | "resilience_automation" | "global_orchestration" | "workforce" | "financial";
  optimizationScore: number;
  riskScore: number;
  integrityImpact: number;
  weight: number;
  explanation: string;
  sourceRef: string;
};

export type NormalizedOptimizationSafeguard = {
  kind: OptimizationSafeguardKind;
  severity: OptimizationSafeguardSeverity;
  optimizationScore: number;
  riskScore: number;
  integrityScore: number;
  confidence: number;
  region?: string | null;
  provider?: string | null;
  entityKind: string;
  entityId?: string | null;
  resilienceAutomationEventId?: string | null;
  predictiveEventId?: string | null;
  globalOrchestrationEventId?: string | null;
  title: string;
  summary: string;
  safeguardGuidance: string;
  constraints: string[];
  rollbackGuidance: string[];
  reasoning: string[];
  safetyFlags: string[];
  sourceRefs: string[];
};

export function normalizeOptimizationScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(Math.max(value, 0), 1) * 100) / 100;
}

export function optimizationSeverityFromRisk(risk: number): OptimizationSafeguardSeverity {
  const score = normalizeOptimizationScore(risk);
  if (score >= 0.9) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "normal";
  return "low";
}

export function normalizeOptimizationSafeguard(
  safeguard: NormalizedOptimizationSafeguard,
): NormalizedOptimizationSafeguard {
  return {
    ...safeguard,
    optimizationScore: normalizeOptimizationScore(safeguard.optimizationScore),
    riskScore: normalizeOptimizationScore(safeguard.riskScore),
    integrityScore: normalizeOptimizationScore(safeguard.integrityScore),
    confidence: normalizeOptimizationScore(safeguard.confidence),
    constraints: safeguard.constraints.slice(0, 10),
    rollbackGuidance: safeguard.rollbackGuidance.slice(0, 10),
    reasoning: safeguard.reasoning.slice(0, 10),
    sourceRefs: safeguard.sourceRefs.slice(0, 12),
  };
}

export function safeguardFromSignals(input: {
  kind: OptimizationSafeguardKind;
  title: string;
  summary: string;
  safeguardGuidance: string;
  constraints: string[];
  rollbackGuidance: string[];
  signals: OptimizationSignal[];
  region?: string | null;
  provider?: string | null;
  entityKind: string;
  entityId?: string | null;
}): NormalizedOptimizationSafeguard {
  const totalWeight = input.signals.reduce((sum, signal) => sum + signal.weight, 0);
  const weighted = (select: (signal: OptimizationSignal) => number) =>
    totalWeight > 0
      ? normalizeOptimizationScore(input.signals.reduce((sum, signal) => sum + select(signal) * signal.weight, 0) / totalWeight)
      : 0;
  const riskScore = weighted((signal) => signal.riskScore);
  return normalizeOptimizationSafeguard({
    kind: input.kind,
    severity: optimizationSeverityFromRisk(riskScore),
    optimizationScore: weighted((signal) => signal.optimizationScore),
    riskScore,
    integrityScore: normalizeOptimizationScore(1 - weighted((signal) => signal.integrityImpact)),
    confidence: input.signals.length > 0 ? 0.76 : 0.35,
    region: input.region,
    provider: input.provider,
    entityKind: input.entityKind,
    entityId: input.entityId,
    title: input.title,
    summary: input.summary,
    safeguardGuidance: input.safeguardGuidance,
    constraints: input.constraints,
    rollbackGuidance: input.rollbackGuidance,
    reasoning: input.signals.map((signal) => signal.explanation),
    safetyFlags: [],
    sourceRefs: Array.from(new Set(input.signals.map((signal) => signal.sourceRef))),
  });
}
