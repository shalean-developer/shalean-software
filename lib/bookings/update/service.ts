import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/src/lib/supabase";
import {
  isBookingStatus,
  toBookingStatusTransitionAudit,
  validateBookingStatusTransition,
  type BookingStatus,
  type BookingTransitionContext,
} from "@/lib/bookings/lifecycle";

import { updateBookingStatusInputSchema } from "./schema";
import type {
  UpdateBookingStatusResult,
  UpdateBookingStatusServiceOptions,
} from "./types";

type BookingRow = {
  id: string;
  status: string;
  row_version: number;
  metadata: unknown;
  updated_at: string;
  cleaner_id: string | null;
};

function buildStatusColumnPatch(
  next: BookingStatus,
  opts: { cancelReason?: string },
): Partial<
  Record<"completed_at" | "cancelled_at" | "cancel_reason", string | null>
> {
  const now = new Date().toISOString();

  if (next === "refunded") {
    return {
      completed_at: null,
      cancelled_at: null,
      cancel_reason: null,
    };
  }

  if (next === "cancelled") {
    return {
      cancelled_at: now,
      cancel_reason: opts.cancelReason ?? null,
    };
  }

  if (next === "completed") {
    return {
      completed_at: now,
    };
  }

  return {};
}

function mergeLastTransitionMetadata(
  existing: unknown,
  params: {
    from: BookingStatus;
    to: BookingStatus;
    actorUserId?: string;
  },
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  return {
    ...base,
    last_status_transition: {
      at: new Date().toISOString(),
      from: params.from,
      to: params.to,
      ...(params.actorUserId ? { actor_user_id: params.actorUserId } : {}),
    },
  };
}

/**
 * Updates `bookings.status` with lifecycle validation and optimistic concurrency.
 *
 * Uses {@link validateBookingStatusTransition} for graph checks. For throw-first flows,
 * see {@link import("@/lib/bookings/lifecycle").requireValidBookingStatusTransition}.
 *
 * **Does not insert `booking_events`** — Postgres triggers emit lifecycle rows when `status` changes.
 */
export async function updateBookingStatus(
  client: SupabaseClient<AppDatabase>,
  rawInput: unknown,
  serviceOptions?: UpdateBookingStatusServiceOptions,
): Promise<UpdateBookingStatusResult> {
  const parsed = updateBookingStatusInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const err = parsed.error;
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Invalid update payload",
      issues: err.issues,
      fieldErrors: err.flatten(),
    };
  }

  const input = parsed.data;
  const bookingId = input.booking_id;

  const { data: row, error: fetchError } = await client
    .from("bookings")
    .select("id, status, row_version, metadata, updated_at, cleaner_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Failed to load booking",
      booking_id: bookingId,
      details: fetchError.message,
    };
  }

  if (!row) {
    return {
      ok: false,
      code: "BOOKING_NOT_FOUND",
      message: "Booking not found",
      booking_id: bookingId,
    };
  }

  const rec = row as BookingRow;

  if (rec.row_version !== input.expected_row_version) {
    return {
      ok: false,
      code: "ROW_VERSION_MISMATCH",
      message: "Booking was modified by another process; reload and retry",
      booking_id: bookingId,
      expected_row_version: input.expected_row_version,
    };
  }

  if (!isBookingStatus(rec.status)) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Booking has an unrecognized status value in the database",
      booking_id: bookingId,
      details: String(rec.status),
    };
  }

  const current = rec.status;

  if (current === "refunded" && input.next_status !== current) {
    return {
      ok: false,
      code: "TERMINAL_BOOKING_LOCKED",
      message: "Refunded bookings cannot change status",
      booking_id: bookingId,
      current_status: current,
    };
  }

  const transition = validateBookingStatusTransition(
    current,
    input.next_status,
    { allowNoOp: input.allow_no_op },
  );

  if (!transition.ok) {
    return {
      ok: false,
      code: "LIFECYCLE_VIOLATION",
      message: transition.message,
      booking_id: bookingId,
      current_status: current,
      requested_status: input.next_status,
      reason: transition.reason,
      allowed_next: transition.allowedNext ?? [],
    };
  }

  try {
    await serviceOptions?.authorize?.({
      bookingId,
      currentStatus: current,
      nextStatus: input.next_status,
      actorUserId: input.actor_user_id,
      cleanerId: rec.cleaner_id,
    });
  } catch (e) {
    return {
      ok: false,
      code: "AUTHORIZATION_DENIED",
      message:
        e instanceof Error ? e.message : "Not authorized to update this booking",
      booking_id: bookingId,
    };
  }

  const auditCtx: BookingTransitionContext = {
    actorUserId: input.actor_user_id,
  };

  const audit = toBookingStatusTransitionAudit(transition, auditCtx);
  if (!audit) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Could not build transition audit record",
      booking_id: bookingId,
    };
  }

  if (transition.kind === "same_status") {
    return {
      ok: true,
      no_op: true,
      booking: {
        id: rec.id,
        status: current,
        row_version: rec.row_version,
        updated_at: rec.updated_at,
      },
      audit,
    };
  }

  const statusPatch = buildStatusColumnPatch(input.next_status, {
    cancelReason: input.cancel_reason,
  });

  const mergedMetadata = mergeLastTransitionMetadata(rec.metadata, {
    from: current,
    to: input.next_status,
    actorUserId: input.actor_user_id,
  });

  const updatePayload: Record<string, unknown> = {
    status: input.next_status,
    metadata: mergedMetadata,
    ...statusPatch,
  };

  if (input.next_status === "assigned" && input.assign_cleaner_id) {
    updatePayload.cleaner_id = input.assign_cleaner_id;
  }

  const { data: updated, error: updateError } = await client
    .from("bookings")
    .update(updatePayload as never)
    .eq("id", bookingId)
    .eq("row_version", input.expected_row_version)
    .select("id, status, row_version, updated_at")
    .maybeSingle();

  if (updateError) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Failed to update booking",
      booking_id: bookingId,
      details: updateError.message,
    };
  }

  const nextRow = updated as {
    id: string;
    status: string;
    row_version: number;
    updated_at: string;
  } | null;

  if (!nextRow) {
    return {
      ok: false,
      code: "ROW_VERSION_MISMATCH",
      message: "Concurrent update detected; reload and retry",
      booking_id: bookingId,
      expected_row_version: input.expected_row_version,
    };
  }

  if (!isBookingStatus(nextRow.status)) {
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Unexpected status value after update",
      booking_id: bookingId,
      details: String(nextRow.status),
    };
  }

  return {
    ok: true,
    no_op: false,
    booking: {
      id: nextRow.id,
      status: nextRow.status,
      row_version: nextRow.row_version,
      updated_at: nextRow.updated_at,
    },
    audit,
  };
}
