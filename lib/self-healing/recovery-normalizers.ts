import type { RecoveryKind, RecoverySeverity } from "./self-healing-events";
import { normalizeDegradationScore, type DegradationSignal } from "./degradation-signals";

export type NormalizedRecoveryRecommendation = {
  kind: RecoveryKind;
  severity: RecoverySeverity;
  confidence: number;
  degradationScore: number;
  region?: string | null;
  provider?: string | null;
  entityKind: string;
  entityId?: string | null;
  bookingId?: string | null;
  assignmentId?: string | null;
  paymentId?: string | null;
  title: string;
  summary: string;
  recommendation: string;
  reasoning: string[];
  recoverySteps: string[];
  safetyFlags: string[];
  sourceRefs: string[];
};

export function recoverySeverityFromScore(score: number): RecoverySeverity {
  const normalized = normalizeDegradationScore(score);
  if (normalized >= 0.9) return "critical";
  if (normalized >= 0.7) return "high";
  if (normalized >= 0.4) return "normal";
  return "low";
}

export function normalizeRecoveryRecommendation(
  recommendation: NormalizedRecoveryRecommendation,
): NormalizedRecoveryRecommendation {
  return {
    ...recommendation,
    confidence: normalizeDegradationScore(recommendation.confidence),
    degradationScore: normalizeDegradationScore(recommendation.degradationScore),
    reasoning: recommendation.reasoning.slice(0, 10),
    recoverySteps: recommendation.recoverySteps.slice(0, 10),
    sourceRefs: recommendation.sourceRefs.slice(0, 12),
  };
}

export function recoveryFromSignals(input: {
  kind: RecoveryKind;
  title: string;
  summary: string;
  recommendation: string;
  recoverySteps: string[];
  signals: DegradationSignal[];
}): NormalizedRecoveryRecommendation {
  const score = normalizeDegradationScore(
    input.signals.reduce((max, signal) => Math.max(max, signal.score), 0),
  );
  const first = input.signals[0];
  return normalizeRecoveryRecommendation({
    kind: input.kind,
    severity: recoverySeverityFromScore(score),
    confidence: input.signals.length > 0 ? 0.72 : 0.35,
    degradationScore: score,
    region: first?.region,
    provider: first?.provider,
    entityKind: first?.entityKind ?? "operational_resilience",
    entityId: first?.entityId,
    title: input.title,
    summary: input.summary,
    recommendation: input.recommendation,
    reasoning: input.signals.map((signal) => signal.explanation),
    recoverySteps: input.recoverySteps,
    safetyFlags: [],
    sourceRefs: Array.from(new Set(input.signals.flatMap((signal) => signal.sourceRefs))),
  });
}
