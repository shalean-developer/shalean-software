import type { BookingStatus } from "@/lib/bookings/lifecycle";

import {
  canTransitionAssignmentStatus,
  type AssignmentStatus,
} from "./assignment-status";
import type { NormalizedAssignment } from "./assignment-normalizers";

export type DispatchConflictKind =
  | "invalid_assignment_transition"
  | "cleaner_double_booked"
  | "booking_not_dispatchable"
  | "cleaner_unavailable";

export type DispatchConflict = {
  kind: DispatchConflictKind;
  message: string;
  assignmentId?: string;
  bookingId?: string;
};

export type DispatchGuardResult =
  | { ok: true }
  | { ok: false; conflicts: DispatchConflict[] };

const DISPATCHABLE_BOOKING_STATUSES = new Set<BookingStatus>([
  "paid",
  "assigned",
  "cleaner_en_route",
  "cleaner_arrived",
  "in_progress",
]);

export function assertAssignmentTransitionAllowed(
  from: AssignmentStatus,
  to: AssignmentStatus,
): DispatchGuardResult {
  if (canTransitionAssignmentStatus(from, to)) return { ok: true };
  return {
    ok: false,
    conflicts: [
      {
        kind: "invalid_assignment_transition",
        message: `Assignment cannot move from ${from} to ${to}.`,
      },
    ],
  };
}

export function assertBookingDispatchable(status: BookingStatus): DispatchGuardResult {
  if (DISPATCHABLE_BOOKING_STATUSES.has(status)) return { ok: true };
  return {
    ok: false,
    conflicts: [
      {
        kind: "booking_not_dispatchable",
        message: `Booking status ${status} is not dispatchable.`,
      },
    ],
  };
}

export function detectCleanerScheduleConflicts(params: {
  cleanerId: string;
  bookingId: string;
  scheduledStart: string;
  scheduledEnd: string;
  activeAssignments: Array<
    NormalizedAssignment & {
      booking?: {
        id: string;
        scheduled_start: string;
        scheduled_end: string;
      };
    }
  >;
}): DispatchConflict[] {
  const start = Date.parse(params.scheduledStart);
  const end = Date.parse(params.scheduledEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];

  return params.activeAssignments.flatMap((assignment) => {
    if (assignment.booking_id === params.bookingId) return [];
    const other = assignment.booking;
    if (!other) return [];
    const otherStart = Date.parse(other.scheduled_start);
    const otherEnd = Date.parse(other.scheduled_end);
    if (!Number.isFinite(otherStart) || !Number.isFinite(otherEnd)) return [];
    const overlaps = start < otherEnd && end > otherStart;
    return overlaps
      ? [
          {
            kind: "cleaner_double_booked" as const,
            assignmentId: assignment.id,
            bookingId: other.id,
            message: "Cleaner already has an overlapping assignment.",
          },
        ]
      : [];
  });
}
