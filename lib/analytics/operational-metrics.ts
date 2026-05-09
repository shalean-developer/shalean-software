import type { AppRole } from "@/lib/auth/types";

export type AnalyticsMetricKind =
  | "booking_completion_rate"
  | "cleaner_acceptance_rate"
  | "reassignment_frequency"
  | "lateness_frequency"
  | "customer_retention_rate"
  | "cancellation_trend"
  | "payout_latency"
  | "dispatch_response_time"
  | "message_response_time"
  | "payment_failure_rate";

export type AnalyticsWindow = "hour" | "day" | "week" | "month" | "quarter";

export type AnalyticsVisibility = "admin" | "cleaner" | "customer" | "internal";

export type AnalyticsMetricFormula = {
  numeratorLabel: string;
  denominatorLabel: string;
  unit: "ratio" | "percent" | "minutes" | "count" | "currency";
  explanation: string;
};

export type OperationalMetric = {
  kind: AnalyticsMetricKind;
  value: number;
  window: AnalyticsWindow;
  visibility: AnalyticsVisibility;
  formula: AnalyticsMetricFormula;
  inputs: Record<string, number>;
  dimensions?: Record<string, string>;
  explanations: string[];
  computedAt?: string;
};

export function safeRatio(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 10_000) / 10_000;
}

export function percentage(numerator: number, denominator: number): number {
  return Math.round(safeRatio(numerator, denominator) * 10_000) / 100;
}

export function createCompletionRateMetric(input: {
  completed: number;
  total: number;
  window: AnalyticsWindow;
}): OperationalMetric {
  const value = percentage(input.completed, input.total);
  return {
    kind: "booking_completion_rate",
    value,
    window: input.window,
    visibility: "admin",
    formula: {
      numeratorLabel: "completed_bookings",
      denominatorLabel: "total_bookings",
      unit: "percent",
      explanation: "Completed bookings divided by total bookings in the selected window.",
    },
    inputs: { completed_bookings: input.completed, total_bookings: input.total },
    explanations: [`${input.completed} completed of ${input.total} total bookings.`],
  };
}

export function createCleanerAcceptanceMetric(input: {
  accepted: number;
  offered: number;
  cleanerId?: string;
  window: AnalyticsWindow;
}): OperationalMetric {
  const value = percentage(input.accepted, input.offered);
  return {
    kind: "cleaner_acceptance_rate",
    value,
    window: input.window,
    visibility: input.cleanerId ? "cleaner" : "admin",
    formula: {
      numeratorLabel: "accepted_assignments",
      denominatorLabel: "offered_assignments",
      unit: "percent",
      explanation: "Accepted assignments divided by offered assignments in the selected window.",
    },
    inputs: { accepted_assignments: input.accepted, offered_assignments: input.offered },
    dimensions: input.cleanerId ? { cleaner_id: input.cleanerId } : undefined,
    explanations: [`${input.accepted} accepted of ${input.offered} offered assignments.`],
  };
}

export function roleCanViewMetric(role: AppRole, metric: Pick<OperationalMetric, "visibility">) {
  if (role === "admin") return true;
  if (metric.visibility === "internal" || metric.visibility === "admin") return false;
  return metric.visibility === role;
}
