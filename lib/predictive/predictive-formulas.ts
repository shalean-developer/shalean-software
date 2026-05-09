import {
  normalizeProbability,
  predictionSeverityFromProbability,
  type NormalizedPrediction,
} from "./prediction-normalizers";

export function forecastSlaBreach(input: {
  minutesUntilStart: number;
  assignmentAccepted: boolean;
  cleanerEnRoute: boolean;
  recentLatenessRate: number;
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
}): NormalizedPrediction {
  const urgency = input.minutesUntilStart <= 0 ? 1 : Math.max(0, 1 - input.minutesUntilStart / 120);
  const assignmentRisk = input.assignmentAccepted ? 0 : 0.35;
  const movementRisk = input.cleanerEnRoute ? 0 : 0.25;
  const probability = normalizeProbability(
    urgency * 0.35 + input.recentLatenessRate * 0.3 + assignmentRisk + movementRisk,
  );
  return {
    kind: "sla_breach",
    severity: predictionSeverityFromProbability(probability),
    confidence: 0.72,
    probability,
    contextKind: "sla_forecast",
    title: "SLA breach forecast",
    summary: "Forecasted SLA risk based on timing, assignment state, cleaner movement, and recent lateness.",
    forecast: "Review the booking before the SLA window narrows further; do not auto-escalate.",
    reasoning: [
      `Minutes until start: ${input.minutesUntilStart}.`,
      `Assignment accepted: ${input.assignmentAccepted}.`,
      `Cleaner en route: ${input.cleanerEnRoute}.`,
      `Recent lateness rate: ${input.recentLatenessRate}.`,
    ],
    sourceRefs: ["booking_lifecycle", "assignment_status", "workforce_lateness_history"],
    safetyFlags: [],
    bookingId: input.bookingId,
    assignmentId: input.assignmentId,
    cleanerId: input.cleanerId,
  };
}

export function forecastWorkforceVolatility(input: {
  burnoutRisk: number;
  fairnessDrift: number;
  coverageRisk: number;
  reassignmentRate: number;
  cleanerId?: string;
}): NormalizedPrediction {
  const probability = normalizeProbability(
    input.burnoutRisk * 0.35 +
      input.fairnessDrift * 0.2 +
      input.coverageRisk * 0.3 +
      input.reassignmentRate * 0.15,
  );
  return {
    kind: "workforce_volatility",
    severity: predictionSeverityFromProbability(probability),
    confidence: 0.68,
    probability,
    contextKind: "workforce_volatility",
    title: "Workforce volatility forecast",
    summary: "Advisory forecast of workforce instability using burnout, fairness, coverage, and reassignment signals.",
    forecast: "Review coverage and workload distribution with a dispatcher before changing assignments.",
    reasoning: [
      `Burnout risk contribution: ${input.burnoutRisk}.`,
      `Fairness drift contribution: ${input.fairnessDrift}.`,
      `Coverage risk contribution: ${input.coverageRisk}.`,
      `Reassignment rate contribution: ${input.reassignmentRate}.`,
    ],
    sourceRefs: ["workforce_intelligence_events", "assignment_events", "analytics_events"],
    safetyFlags: [],
    cleanerId: input.cleanerId,
  };
}

export function forecastPaymentFailure(input: {
  priorFailureRate: number;
  retryCount: number;
  invoiceOverdueRate: number;
  bookingId?: string;
  paymentId?: string;
}): NormalizedPrediction {
  const probability = normalizeProbability(
    input.priorFailureRate * 0.45 +
      Math.min(1, input.retryCount / 3) * 0.3 +
      input.invoiceOverdueRate * 0.25,
  );
  return {
    kind: "payment_failure",
    severity: predictionSeverityFromProbability(probability),
    confidence: 0.64,
    probability,
    contextKind: "financial_forecast",
    title: "Payment failure forecast",
    summary: "Provider-independent payment failure forecast based on historical failure and invoice settlement patterns.",
    forecast: "Prepare support follow-up if payment recovery fails; do not charge or refund automatically.",
    reasoning: [
      `Prior failure rate: ${input.priorFailureRate}.`,
      `Retry count: ${input.retryCount}.`,
      `Invoice overdue rate: ${input.invoiceOverdueRate}.`,
    ],
    sourceRefs: ["payments", "invoices", "financial_reconciliation"],
    safetyFlags: [],
    bookingId: input.bookingId,
    paymentId: input.paymentId,
  };
}
