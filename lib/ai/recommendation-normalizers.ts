import type { Json } from "@/lib/database.types";

import type { AiOperationalContextKind } from "./operational-context-builder";

export type AiAssistanceKind =
  | "dispatch_narrative"
  | "booking_summary"
  | "escalation_interpretation"
  | "anomaly_explanation"
  | "workforce_guidance"
  | "financial_summary"
  | "shift_summary";

export type AiAssistanceStatus = "draft" | "ready" | "accepted" | "rejected" | "overridden" | "blocked";

export type AiConfidence = "low" | "medium" | "high";

export type NormalizedAiRecommendation = {
  kind: AiAssistanceKind;
  status?: AiAssistanceStatus;
  confidence: AiConfidence;
  contextKind: AiOperationalContextKind;
  title: string;
  summary: string;
  recommendation: string;
  reasoningSummary: string[];
  sourceRefs: string[];
  safetyFlags: string[];
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
  customerId?: string;
  metadata?: Json;
};

export function confidenceFromScore(score: number): AiConfidence {
  if (score >= 0.75) return "high";
  if (score >= 0.45) return "medium";
  return "low";
}

export function normalizeAiRecommendation(
  recommendation: NormalizedAiRecommendation,
): NormalizedAiRecommendation {
  return {
    ...recommendation,
    status: recommendation.status ?? "ready",
    reasoningSummary: recommendation.reasoningSummary.slice(0, 6),
    sourceRefs: recommendation.sourceRefs.slice(0, 12),
    safetyFlags: recommendation.safetyFlags,
  };
}
