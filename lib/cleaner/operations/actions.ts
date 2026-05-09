"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { isBookingStatus } from "@/lib/bookings/lifecycle";
import { updateBookingStatus } from "@/lib/bookings/update";
import { updateBookingStatusInputSchema } from "@/lib/bookings/update/schema";
import { emitMonitoringEvent, MONITORING_CATEGORY } from "@/lib/operational/monitoring";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

import { assertCleanerBookingTransition } from "./cleaner-transitions";

export type CleanerLifecycleActionState = {
  ok: boolean;
  message?: string;
};

function emptyToUndefined(v: FormDataEntryValue | null): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

/**
 * Cleaner field workflow via centralized {@link updateBookingStatus}.
 * App-layer {@link assertCleanerBookingTransition} enforces the linear path; Postgres
 * triggers and RLS enforce the global graph and column immutability.
 */
export async function cleanerBookingLifecycleAction(
  _prev: CleanerLifecycleActionState | undefined,
  formData: FormData,
): Promise<CleanerLifecycleActionState> {
  const authUser = await requireRole("cleaner");
  const client = await createServerSupabaseClient();

  const raw = {
    booking_id: emptyToUndefined(formData.get("booking_id")),
    expected_row_version: formData.get("expected_row_version"),
    next_status: emptyToUndefined(formData.get("next_status")),
    allow_no_op: true,
    actor_user_id: authUser.id,
  };

  const parsed = updateBookingStatusInputSchema.safeParse({
    ...raw,
    expected_row_version:
      typeof raw.expected_row_version === "string" || typeof raw.expected_row_version === "number"
        ? Number(raw.expected_row_version)
        : NaN,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid form",
    };
  }

  if (!isBookingStatus(parsed.data.next_status)) {
    return { ok: false, message: "Invalid target status" };
  }

  const result = await updateBookingStatus(client, parsed.data, {
    authorize: async (ctx) => {
      if (!ctx.actorUserId) {
        throw new Error("Missing authenticated user for this update");
      }
      if (!ctx.cleanerId || ctx.cleanerId !== ctx.actorUserId) {
        throw new Error("You are not assigned to this booking");
      }
      assertCleanerBookingTransition(ctx.currentStatus, ctx.nextStatus);
    },
  });

  if (!result.ok) {
    const sev =
      result.code === "ROW_VERSION_MISMATCH" ||
      result.code === "LIFECYCLE_VIOLATION" ||
      result.code === "AUTHORIZATION_DENIED"
        ? ("warning" as const)
        : ("error" as const);
    const cat =
      result.code === "ROW_VERSION_MISMATCH"
        ? MONITORING_CATEGORY.CONCURRENCY
        : result.code === "LIFECYCLE_VIOLATION"
          ? MONITORING_CATEGORY.LIFECYCLE
          : result.code === "AUTHORIZATION_DENIED"
            ? MONITORING_CATEGORY.AUTHORIZATION
            : MONITORING_CATEGORY.CLEANER_OPS;
    emitMonitoringEvent({
      category: cat,
      severity: sev,
      event: "cleaner.lifecycle.update.failed",
      payload: {
        booking_id: parsed.data.booking_id,
        actor_user_id: authUser.id,
        code: result.code,
        next_status: parsed.data.next_status,
      },
    });
    if (result.code === "ROW_VERSION_MISMATCH") {
      return {
        ok: false,
        message:
          "This job was updated from another screen or device. Refresh the page, then tap the action once more.",
      };
    }
    if (result.code === "LIFECYCLE_VIOLATION") {
      return {
        ok: false,
        message:
          "That step isn’t available for this job right now. Refresh, or contact dispatch if you’re unsure what’s next.",
      };
    }
    if (result.code === "AUTHORIZATION_DENIED") {
      return {
        ok: false,
        message: "You’re no longer assigned to this job. Open My jobs for your current list.",
      };
    }
    return { ok: false, message: result.message };
  }

  const bookingId = parsed.data.booking_id;
  revalidatePath("/cleaner/jobs");
  revalidatePath(`/cleaner/jobs/${bookingId}`);
  return { ok: true, message: "Saved." };
}
