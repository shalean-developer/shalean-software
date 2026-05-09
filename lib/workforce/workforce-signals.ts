import type { Json } from "@/lib/database.types";

export type WorkforceSignalKind =
  | "capacity_estimate"
  | "workload_saturation"
  | "shift_density"
  | "burnout_risk"
  | "fairness_balance"
  | "payout_distribution"
  | "dispatch_weighting"
  | "resilience_risk"
  | "coverage_gap"
  | "elasticity_score";

export type WorkforceSeverity = "low" | "normal" | "high" | "critical";

export type WorkforceEventStatus = "active" | "reviewed" | "dismissed" | "resolved";

export type WorkforceVisibility = "admin" | "cleaner" | "internal";

export type WorkforceInsight = {
  kind: WorkforceSignalKind;
  severity: WorkforceSeverity;
  status?: WorkforceEventStatus;
  visibility: WorkforceVisibility;
  cleanerId?: string;
  bookingId?: string;
  assignmentId?: string;
  score: number;
  title: string;
  summary: string;
  inputs: Record<string, number>;
  explanations: string[];
  recommendedAction?: string;
  metadata?: Json;
};

export function normalizeWorkforceScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.round(Math.min(Math.max(score, 0), 1) * 100) / 100;
}

export function workforceSeverityFromScore(score: number): WorkforceSeverity {
  const normalized = normalizeWorkforceScore(score);
  if (normalized >= 0.9) return "critical";
  if (normalized >= 0.7) return "high";
  if (normalized >= 0.4) return "normal";
  return "low";
}
