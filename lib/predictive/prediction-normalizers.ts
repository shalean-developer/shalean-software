import type { Json } from "@/lib/database.types";

import type { PredictionContextKind } from "./prediction-context-builder";

export type PredictionKind =
  | "sla_breach"
  | "lateness"
  | "reassignment"
  | "cancellation"
  | "operational_degradation"
  | "workforce_volatility"
  | "payment_failure"
  | "payout_delay"
  | "refund_anomaly";

export type PredictionStatus = "active" | "accepted" | "rejected" | "overridden" | "expired" | "blocked";

export type PredictionSeverity = "low" | "medium" | "high" | "critical";

export type NormalizedPrediction = {
  kind: PredictionKind;
  status?: PredictionStatus;
  severity: PredictionSeverity;
  confidence: number;
  probability: number;
  contextKind: PredictionContextKind;
  title: string;
  summary: string;
  forecast: string;
  reasoning: string[];
  sourceRefs: string[];
  safetyFlags: string[];
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
  customerId?: string;
  paymentId?: string;
  validUntil?: string | null;
  metadata?: Json;
};

export function normalizeProbability(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(Math.max(value, 0), 1) * 100) / 100;
}

export function predictionSeverityFromProbability(probability: number): PredictionSeverity {
  const normalized = normalizeProbability(probability);
  if (normalized >= 0.9) return "critical";
  if (normalized >= 0.7) return "high";
  if (normalized >= 0.4) return "medium";
  return "low";
}

export function normalizePrediction(prediction: NormalizedPrediction): NormalizedPrediction {
  return {
    ...prediction,
    status: prediction.status ?? "active",
    confidence: normalizeProbability(prediction.confidence),
    probability: normalizeProbability(prediction.probability),
    reasoning: prediction.reasoning.slice(0, 8),
    sourceRefs: prediction.sourceRefs.slice(0, 12),
  };
}
