export type DecisionScoreKind =
  | "operational_risk"
  | "assignment_confidence"
  | "lateness_risk"
  | "escalation_severity"
  | "dispatch_health"
  | "workforce_utilization";

export type DecisionScore = {
  kind: DecisionScoreKind;
  score: number;
  label: "low" | "moderate" | "high" | "critical";
  inputs: Record<string, number>;
  explanations: string[];
};

export function normalizeDecisionScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.round(Math.min(Math.max(score, 0), 1) * 100) / 100;
}

export function decisionLabel(score: number): DecisionScore["label"] {
  const normalized = normalizeDecisionScore(score);
  if (normalized >= 0.9) return "critical";
  if (normalized >= 0.7) return "high";
  if (normalized >= 0.4) return "moderate";
  return "low";
}

export function computeOperationalRiskScore(input: {
  cancellationRate: number;
  latenessRate: number;
  reassignmentRate: number;
  paymentFailureRate: number;
}): DecisionScore {
  const score = normalizeDecisionScore(
    input.cancellationRate * 0.25 +
      input.latenessRate * 0.3 +
      input.reassignmentRate * 0.25 +
      input.paymentFailureRate * 0.2,
  );
  return {
    kind: "operational_risk",
    score,
    label: decisionLabel(score),
    inputs: {
      cancellation_rate: input.cancellationRate,
      lateness_rate: input.latenessRate,
      reassignment_rate: input.reassignmentRate,
      payment_failure_rate: input.paymentFailureRate,
    },
    explanations: [
      "Operational risk weighs lateness, reassignments, cancellations, and payment failures.",
      "Lateness and reassignment rates carry the highest operational impact.",
    ],
  };
}

export function computeAssignmentConfidenceScore(input: {
  cleanerAcceptanceRate: number;
  workloadBalance: number;
  scheduleFit: number;
  completionConsistency: number;
}): DecisionScore {
  const score = normalizeDecisionScore(
    input.cleanerAcceptanceRate * 0.3 +
      input.workloadBalance * 0.25 +
      input.scheduleFit * 0.25 +
      input.completionConsistency * 0.2,
  );
  return {
    kind: "assignment_confidence",
    score,
    label: decisionLabel(1 - score),
    inputs: {
      cleaner_acceptance_rate: input.cleanerAcceptanceRate,
      workload_balance: input.workloadBalance,
      schedule_fit: input.scheduleFit,
      completion_consistency: input.completionConsistency,
    },
    explanations: [
      "Assignment confidence combines acceptance history, workload balance, schedule fit, and completion consistency.",
      "This score is advisory and never assigns cleaners automatically.",
    ],
  };
}

export function computeDispatchHealthScore(input: {
  openQueueCount: number;
  staleAssignmentCount: number;
  activeCleanerCount: number;
}): DecisionScore {
  const queuePressure = input.activeCleanerCount > 0 ? input.openQueueCount / input.activeCleanerCount : 1;
  const stalePressure = input.openQueueCount > 0 ? input.staleAssignmentCount / input.openQueueCount : 0;
  const score = normalizeDecisionScore(1 - Math.min(1, queuePressure * 0.5 + stalePressure * 0.5));
  return {
    kind: "dispatch_health",
    score,
    label: decisionLabel(1 - score),
    inputs: {
      open_queue_count: input.openQueueCount,
      stale_assignment_count: input.staleAssignmentCount,
      active_cleaner_count: input.activeCleanerCount,
    },
    explanations: [
      "Dispatch health compares queue pressure with active cleaner capacity.",
      "Stale assignments reduce the health score because they indicate orchestration friction.",
    ],
  };
}
