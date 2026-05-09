import {
  normalizeWorkforceScore,
  workforceSeverityFromScore,
  type WorkforceInsight,
} from "./workforce-signals";

export function computeCapacityEstimate(input: {
  scheduledMinutes: number;
  availableMinutes: number;
  cleanerId?: string;
}): WorkforceInsight {
  const utilization = normalizeWorkforceScore(input.scheduledMinutes / Math.max(1, input.availableMinutes));
  return {
    kind: "capacity_estimate",
    severity: workforceSeverityFromScore(utilization),
    visibility: input.cleanerId ? "cleaner" : "admin",
    cleanerId: input.cleanerId,
    score: utilization,
    title: "Cleaner capacity estimate",
    summary: "Estimated capacity compares scheduled workload minutes with available shift minutes.",
    inputs: {
      scheduled_minutes: input.scheduledMinutes,
      available_minutes: input.availableMinutes,
      utilization,
    },
    explanations: [
      "Capacity is derived from scheduled minutes divided by available minutes.",
      "This signal is advisory and does not suppress or alter assignment eligibility.",
    ],
  };
}

export function computeBurnoutRisk(input: {
  assignmentsLast7Days: number;
  lateArrivalsLast7Days: number;
  overtimeMinutesLast7Days: number;
  cleanerId: string;
}): WorkforceInsight {
  const assignmentPressure = Math.min(1, input.assignmentsLast7Days / 14);
  const latenessPressure = Math.min(1, input.lateArrivalsLast7Days / 4);
  const overtimePressure = Math.min(1, input.overtimeMinutesLast7Days / 480);
  const score = normalizeWorkforceScore(
    assignmentPressure * 0.4 + latenessPressure * 0.25 + overtimePressure * 0.35,
  );
  return {
    kind: "burnout_risk",
    severity: workforceSeverityFromScore(score),
    visibility: "admin",
    cleanerId: input.cleanerId,
    score,
    title: "Burnout risk signal",
    summary: "Advisory fatigue signal based on workload density, lateness, and overtime.",
    inputs: {
      assignments_last_7_days: input.assignmentsLast7Days,
      late_arrivals_last_7_days: input.lateArrivalsLast7Days,
      overtime_minutes_last_7_days: input.overtimeMinutesLast7Days,
      assignment_pressure: assignmentPressure,
      lateness_pressure: latenessPressure,
      overtime_pressure: overtimePressure,
    },
    explanations: [
      "Assignments carry 40%, overtime 35%, and repeated lateness 25% of the score.",
      "The score is not punitive and requires human review before any action.",
    ],
    recommendedAction: score >= 0.7 ? "Review workload balance before offering more dense shifts." : undefined,
  };
}

export function computeDispatchWeight(input: {
  availabilityFit: number;
  reliabilityConsistency: number;
  travelEfficiency: number;
  workloadBalance: number;
  continuityPreference: number;
  cleanerId: string;
  bookingId?: string;
}): WorkforceInsight {
  const score = normalizeWorkforceScore(
    input.availabilityFit * 0.3 +
      input.reliabilityConsistency * 0.25 +
      input.travelEfficiency * 0.15 +
      input.workloadBalance * 0.2 +
      input.continuityPreference * 0.1,
  );
  return {
    kind: "dispatch_weighting",
    severity: workforceSeverityFromScore(1 - score),
    visibility: "admin",
    cleanerId: input.cleanerId,
    bookingId: input.bookingId,
    score,
    title: "Advisory dispatch weighting",
    summary: "Weighted cleaner fit score for dispatcher review.",
    inputs: {
      availability_fit: input.availabilityFit,
      reliability_consistency: input.reliabilityConsistency,
      travel_efficiency: input.travelEfficiency,
      workload_balance: input.workloadBalance,
      continuity_preference: input.continuityPreference,
    },
    explanations: [
      "Availability fit has the highest weight because lifecycle continuity depends on viable scheduling.",
      "This weighting is advisory and never creates assignments automatically.",
    ],
    recommendedAction: "Review fit score alongside dispatcher context before assigning.",
  };
}
