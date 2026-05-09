import {
  createAssignment,
  reassignBooking,
  updateAssignment,
  getAssignmentsForCleaner,
  upsertCleanerOperationalState,
  type CleanerOperationalStateInput,
  type CreateAssignmentInput,
  type ReassignBookingInput,
  type UpdateAssignmentInput,
} from "@/lib/data-access/dispatch";
import { getBookingById } from "@/lib/data-access/bookings";
import type { DataAccessResult, ShaleanSupabaseClient } from "@/lib/data-access/types";

import type { NormalizedAssignment } from "./assignment-normalizers";
import {
  assertBookingDispatchable,
  detectCleanerScheduleConflicts,
  type DispatchConflict,
} from "./dispatch-guards";

export type DispatchEngineResult<T> =
  | DataAccessResult<T>
  | { ok: false; message: string; conflicts: DispatchConflict[] };

function conflictResult(conflicts: DispatchConflict[]): DispatchEngineResult<never> {
  return {
    ok: false,
    message: conflicts[0]?.message ?? "Dispatch conflict detected",
    conflicts,
  };
}

export async function proposeCleanerAssignment(
  client: ShaleanSupabaseClient,
  input: CreateAssignmentInput,
): Promise<DispatchEngineResult<NormalizedAssignment>> {
  const booking = await getBookingById(client, input.booking_id);
  if (!booking.ok) return booking;
  if (!booking.data) return { ok: false, message: "Booking not found" };

  const dispatchable = assertBookingDispatchable(booking.data.status);
  if (!dispatchable.ok) return conflictResult(dispatchable.conflicts);

  const currentAssignments = await getAssignmentsForCleaner(client, input.cleaner_id);
  if (!currentAssignments.ok) return currentAssignments;

  const conflicts = detectCleanerScheduleConflicts({
    cleanerId: input.cleaner_id,
    bookingId: input.booking_id,
    scheduledStart: booking.data.scheduled_start,
    scheduledEnd: booking.data.scheduled_end,
    activeAssignments: currentAssignments.data,
  });
  if (conflicts.length > 0) return conflictResult(conflicts);

  return createAssignment(client, {
    ...input,
    status: input.status ?? "assignment_proposed",
  });
}

export async function transitionCleanerAssignment(
  client: ShaleanSupabaseClient,
  input: UpdateAssignmentInput,
): Promise<DispatchEngineResult<NormalizedAssignment>> {
  return updateAssignment(client, input);
}

export async function reassignCleanerBooking(
  client: ShaleanSupabaseClient,
  input: ReassignBookingInput,
): Promise<DispatchEngineResult<NormalizedAssignment>> {
  return reassignBooking(client, input);
}

export async function setCleanerOperationalState(
  client: ShaleanSupabaseClient,
  input: CleanerOperationalStateInput,
) {
  return upsertCleanerOperationalState(client, input);
}

export function createDispatchDebugLogger(scope: string) {
  return (message: string, details?: unknown) => {
    if (process.env.NODE_ENV === "production") return;
    if (details === undefined) {
      console.debug(`[shalean:dispatch:${scope}] ${message}`);
    } else {
      console.debug(`[shalean:dispatch:${scope}] ${message}`, details);
    }
  };
}
