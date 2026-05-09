/**
 * Next.js App Router — Server Action / Route Handler patterns.
 *
 * Lifecycle events (`booking_events`) are created by **database triggers** when `status`
 * changes. This service must not insert those rows manually.
 */

import { requireValidBookingStatusTransition } from "@/lib/bookings/lifecycle";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

import { updateBookingStatus } from "./service";

/** Standard path: structured results + optimistic concurrency. */
export async function exampleUpdateBookingStatusAction(input: unknown) {
  const client = await createServerSupabaseClient();

  return updateBookingStatus(client, input, {
    authorize: async (ctx) => {
      // Future: enforce `ctx.actorUserId` against booking ownership / `app_metadata.role`.
      void ctx.cleanerId;
      void ctx.actorUserId;
    },
  });
}

/**
 * Alternative: throw-first validation (e.g. internal admin scripts) before calling Supabase.
 * Prefer `updateBookingStatus` in HTTP handlers so clients receive structured errors.
 */
export function exampleAssertTransitionThenDelegate(
  currentStatus: string,
  nextStatus: string,
) {
  requireValidBookingStatusTransition(currentStatus, nextStatus, {
    allowNoOp: false,
  });
}
