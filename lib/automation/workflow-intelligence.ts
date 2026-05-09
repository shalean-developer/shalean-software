import type { WorkflowBookingProjection } from "@/lib/data-access/bookings";
import type { NormalizedAssignment } from "@/lib/dispatch/assignment-normalizers";

import type { AutomationRecommendation } from "./automation-events";
import {
  normalizeSignalScore,
  severityFromScore,
  type OperationalSignal,
} from "./operational-signals";

function minutesUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round((parsed - Date.now()) / 60_000);
}

export function detectBookingInactivitySignal(input: {
  booking: Pick<WorkflowBookingProjection, "id" | "lifecycleState" | "updatedAt">;
  maxIdleMinutes?: number;
}): OperationalSignal | null {
  const maxIdleMinutes = input.maxIdleMinutes ?? 45;
  const idleMinutes = Math.max(0, Math.round((Date.now() - input.booking.updatedAt) / 60_000));
  if (idleMinutes < maxIdleMinutes || input.booking.lifecycleState === "completed") return null;

  const score = normalizeSignalScore(Math.min(1, idleMinutes / (maxIdleMinutes * 2)));
  return {
    kind: "booking_inactivity",
    severity: severityFromScore(score),
    score,
    title: "Booking inactivity risk",
    summary: `Booking has not changed lifecycle state for ${idleMinutes} minutes.`,
    bookingId: input.booking.id,
    visibility: "admin",
    reasoning: [
      `Idle duration ${idleMinutes}m exceeds ${maxIdleMinutes}m threshold.`,
      `Current lifecycle state is ${input.booking.lifecycleState}.`,
    ],
    metadata: { idle_minutes: idleMinutes, threshold_minutes: maxIdleMinutes },
  };
}

export function detectCleanerLatenessRisk(input: {
  assignment: Pick<NormalizedAssignment, "id" | "booking_id" | "cleaner_id" | "status">;
  scheduledStart: string;
  graceMinutes?: number;
}): OperationalSignal | null {
  const untilStart = minutesUntil(input.scheduledStart);
  if (untilStart === null) return null;
  const graceMinutes = input.graceMinutes ?? 15;
  const notMoving =
    input.assignment.status !== "cleaner_en_route" &&
    input.assignment.status !== "cleaner_arrived" &&
    input.assignment.status !== "in_service";
  if (!notMoving || untilStart > graceMinutes) return null;

  const score = normalizeSignalScore(untilStart < 0 ? 0.9 : 0.65);
  return {
    kind: "cleaner_lateness_risk",
    severity: severityFromScore(score),
    score,
    title: "Cleaner lateness risk",
    summary: "Cleaner has not progressed toward arrival close to the scheduled start.",
    bookingId: input.assignment.booking_id,
    assignmentId: input.assignment.id,
    cleanerId: input.assignment.cleaner_id,
    visibility: "admin",
    reasoning: [
      `Scheduled start is ${untilStart} minutes away.`,
      `Assignment status is ${input.assignment.status}.`,
    ],
    metadata: { minutes_until_start: untilStart, grace_minutes: graceMinutes },
  };
}

export function recommendCleanerForBooking(input: {
  bookingId: string;
  candidateCleanerId: string;
  workloadCount: number;
  conflictCount: number;
  proximityScore?: number;
}): AutomationRecommendation {
  const workloadScore = Math.max(0, 1 - input.workloadCount / 6);
  const conflictScore = input.conflictCount === 0 ? 1 : 0.35;
  const score = normalizeSignalScore(
    (workloadScore + conflictScore + (input.proximityScore ?? 0.6)) / 3,
  );
  return {
    eventKind: "dispatch_recommendation",
    recommendationKind: "workload_balanced_assignment",
    kind: input.conflictCount > 0 ? "schedule_conflict_risk" : "overload_detection",
    severity: severityFromScore(1 - score),
    score,
    title: "Cleaner recommendation",
    summary: "Recommended cleaner based on workload balance and conflict risk.",
    bookingId: input.bookingId,
    cleanerId: input.candidateCleanerId,
    candidateCleanerId: input.candidateCleanerId,
    visibility: "admin",
    recommendedAction: "Review recommended cleaner and assign manually if appropriate.",
    reasoning: [
      `Active workload count: ${input.workloadCount}.`,
      `Detected conflicts: ${input.conflictCount}.`,
      `Proximity score: ${input.proximityScore ?? 0.6}.`,
    ],
    metadata: {
      workload_count: input.workloadCount,
      conflict_count: input.conflictCount,
      proximity_score: input.proximityScore ?? 0.6,
    },
  };
}
