import type { AppRole } from "@/lib/auth/types";

export type OperationalSignalKind =
  | "cleaner_lateness_risk"
  | "schedule_conflict_risk"
  | "overload_detection"
  | "payout_anomaly"
  | "booking_inactivity"
  | "customer_escalation_risk"
  | "reassignment_likelihood"
  | "recurring_cadence_anomaly"
  | "workforce_utilization";

export type AutomationSeverity = "low" | "medium" | "high" | "critical";

export type AutomationVisibility = "admin" | "cleaner" | "customer" | "internal";

export type OperationalSignal = {
  id?: string;
  kind: OperationalSignalKind;
  severity: AutomationSeverity;
  score: number;
  title: string;
  summary: string;
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
  paymentId?: string;
  targetUserId?: string;
  visibility: AutomationVisibility;
  reasoning: string[];
  metadata?: Record<string, unknown>;
  occurredAt?: string;
};

const SEVERITY_BY_SCORE: Array<[number, AutomationSeverity]> = [
  [0.9, "critical"],
  [0.7, "high"],
  [0.4, "medium"],
  [0, "low"],
];

export function severityFromScore(score: number): AutomationSeverity {
  const normalized = Math.min(Math.max(score, 0), 1);
  return SEVERITY_BY_SCORE.find(([threshold]) => normalized >= threshold)?.[1] ?? "low";
}

export function normalizeSignalScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.round(Math.min(Math.max(score, 0), 1) * 100) / 100;
}

export function roleCanViewAutomationSignal(role: AppRole, signal: OperationalSignal): boolean {
  if (role === "admin") return true;
  if (signal.visibility === "internal" || signal.visibility === "admin") return false;
  return signal.visibility === role;
}
