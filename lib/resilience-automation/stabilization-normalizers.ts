import type {
  ResilienceAutomationKind,
  ResilienceAutomationSeverity,
} from "./resilience-automation-events";

export type StabilizationSignal = {
  source: "self_healing" | "global_orchestration" | "predictive" | "realtime" | "queue";
  score: number;
  weight: number;
  explanation: string;
  sourceRef: string;
};

export type NormalizedResilienceAutomation = {
  kind: ResilienceAutomationKind;
  severity: ResilienceAutomationSeverity;
  priorityScore: number;
  congestionScore: number;
  confidence: number;
  pacingWindowSeconds: number;
  region?: string | null;
  provider?: string | null;
  entityKind: string;
  entityId?: string | null;
  selfHealingEventId?: string | null;
  globalOrchestrationEventId?: string | null;
  predictiveEventId?: string | null;
  title: string;
  summary: string;
  automationGuidance: string;
  sequenceSteps: string[];
  throttlingGuidance: string[];
  reasoning: string[];
  safetyFlags: string[];
  sourceRefs: string[];
};

export function normalizeAutomationScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(Math.max(value, 0), 1) * 100) / 100;
}

export function automationSeverityFromPriority(priority: number): ResilienceAutomationSeverity {
  const score = normalizeAutomationScore(priority);
  if (score >= 0.9) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "normal";
  return "low";
}

export function normalizeResilienceAutomation(
  recommendation: NormalizedResilienceAutomation,
): NormalizedResilienceAutomation {
  return {
    ...recommendation,
    priorityScore: normalizeAutomationScore(recommendation.priorityScore),
    congestionScore: normalizeAutomationScore(recommendation.congestionScore),
    confidence: normalizeAutomationScore(recommendation.confidence),
    pacingWindowSeconds: Math.max(0, Math.round(recommendation.pacingWindowSeconds)),
    sequenceSteps: recommendation.sequenceSteps.slice(0, 10),
    throttlingGuidance: recommendation.throttlingGuidance.slice(0, 10),
    reasoning: recommendation.reasoning.slice(0, 10),
    sourceRefs: recommendation.sourceRefs.slice(0, 12),
  };
}

export function automationFromSignals(input: {
  kind: ResilienceAutomationKind;
  title: string;
  summary: string;
  automationGuidance: string;
  sequenceSteps: string[];
  throttlingGuidance: string[];
  signals: StabilizationSignal[];
  region?: string | null;
  provider?: string | null;
  entityKind: string;
  entityId?: string | null;
}): NormalizedResilienceAutomation {
  const weighted = input.signals.reduce(
    (total, signal) => total + normalizeAutomationScore(signal.score) * signal.weight,
    0,
  );
  const totalWeight = input.signals.reduce((total, signal) => total + signal.weight, 0);
  const priorityScore = totalWeight > 0 ? normalizeAutomationScore(weighted / totalWeight) : 0;
  const congestionScore = normalizeAutomationScore(
    Math.max(0, ...input.signals.map((signal) => signal.score)),
  );

  return normalizeResilienceAutomation({
    kind: input.kind,
    severity: automationSeverityFromPriority(priorityScore),
    priorityScore,
    congestionScore,
    confidence: input.signals.length > 0 ? 0.74 : 0.35,
    pacingWindowSeconds: Math.round(30 + congestionScore * 270),
    region: input.region,
    provider: input.provider,
    entityKind: input.entityKind,
    entityId: input.entityId,
    title: input.title,
    summary: input.summary,
    automationGuidance: input.automationGuidance,
    sequenceSteps: input.sequenceSteps,
    throttlingGuidance: input.throttlingGuidance,
    reasoning: input.signals.map((signal) => signal.explanation),
    safetyFlags: [],
    sourceRefs: Array.from(new Set(input.signals.map((signal) => signal.sourceRef))),
  });
}
