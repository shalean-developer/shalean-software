import {
  normalizeWorkforceScore,
  workforceSeverityFromScore,
  type WorkforceInsight,
} from "./workforce-signals";

export function computeFairnessBalance(input: {
  cleanerId: string;
  cleanerAssignments: number;
  teamAverageAssignments: number;
  cleanerNetPayoutCents: number;
  teamAverageNetPayoutCents: number;
}): WorkforceInsight {
  const assignmentSkew = Math.abs(input.cleanerAssignments - input.teamAverageAssignments) / Math.max(1, input.teamAverageAssignments);
  const payoutSkew = Math.abs(input.cleanerNetPayoutCents - input.teamAverageNetPayoutCents) / Math.max(1, input.teamAverageNetPayoutCents);
  const score = normalizeWorkforceScore((assignmentSkew + payoutSkew) / 2);
  return {
    kind: "fairness_balance",
    severity: workforceSeverityFromScore(score),
    visibility: "admin",
    cleanerId: input.cleanerId,
    score,
    title: "Workload fairness balance",
    summary: "Fairness signal compares assignment and payout distribution against team averages.",
    inputs: {
      cleaner_assignments: input.cleanerAssignments,
      team_average_assignments: input.teamAverageAssignments,
      cleaner_net_payout_cents: input.cleanerNetPayoutCents,
      team_average_net_payout_cents: input.teamAverageNetPayoutCents,
      assignment_skew: assignmentSkew,
      payout_skew: payoutSkew,
    },
    explanations: [
      "Fairness score is average skew across assignment volume and payout distribution.",
      "Dispatchers retain authority; this only surfaces distribution context.",
    ],
  };
}

export function computeResilienceRisk(input: {
  coverageCleanerCount: number;
  activeBookingCount: number;
  reassignmentCount: number;
  cancellationRecoveryCount: number;
}): WorkforceInsight {
  const coveragePressure = 1 - Math.min(1, input.coverageCleanerCount / Math.max(1, input.activeBookingCount));
  const reassignmentPressure = Math.min(1, input.reassignmentCount / Math.max(1, input.activeBookingCount));
  const recoveryPressure = 1 - Math.min(1, input.cancellationRecoveryCount / Math.max(1, input.reassignmentCount || 1));
  const score = normalizeWorkforceScore(
    coveragePressure * 0.45 + reassignmentPressure * 0.35 + recoveryPressure * 0.2,
  );
  return {
    kind: "resilience_risk",
    severity: workforceSeverityFromScore(score),
    visibility: "admin",
    score,
    title: "Workforce resilience risk",
    summary: "Coverage and reassignment resilience signal for operational review.",
    inputs: {
      coverage_cleaner_count: input.coverageCleanerCount,
      active_booking_count: input.activeBookingCount,
      reassignment_count: input.reassignmentCount,
      cancellation_recovery_count: input.cancellationRecoveryCount,
      coverage_pressure: coveragePressure,
      reassignment_pressure: reassignmentPressure,
      recovery_pressure: recoveryPressure,
    },
    explanations: [
      "Coverage pressure carries the largest weight because redundancy protects service continuity.",
      "Reassignment and recovery rates indicate sensitivity to operational disruption.",
    ],
  };
}
