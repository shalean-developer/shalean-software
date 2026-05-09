"use server";

import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { isBookingStatus } from "@/lib/bookings/lifecycle";
import { emitMonitoringEvent, MONITORING_CATEGORY } from "@/lib/operational/monitoring";
import {
  assertStaffLifecycleReconciliationGate,
  STAFF_LIFECYCLE_RECONCILIATION_EVENT,
} from "@/lib/payments/reconciliation";
import { updateBookingStatus } from "@/lib/bookings/update";
import { updateBookingStatusInputSchema } from "@/lib/bookings/update/schema";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export type AdminLifecycleActionState = {
  ok: boolean;
  message?: string;
  /** Machine-readable failure for UI (e.g. reconciliation gate). */
  code?: string;
};

function emptyToUndefined(v: FormDataEntryValue | null): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

/**
 * Verifies optional break-glass token (timing-safe). Disabled unless both env vars are set.
 * Future: rotate secret via infra; never log the provided token.
 */
function verifyReconciliationBreakGlass(formData: FormData): boolean {
  const enabled = process.env.RECONCILIATION_OVERRIDE_ENABLED === "true";
  const secret = process.env.RECONCILIATION_OVERRIDE_SECRET?.trim();
  if (!enabled || !secret || secret.length < 16) {
    return false;
  }
  const provided = String(formData.get("reconciliation_override") ?? "").trim();
  if (provided.length !== secret.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(secret, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Dispatcher/admin lifecycle transition via centralized {@link updateBookingStatus}.
 * Server-side reconciliation gate blocks divergent moves except `awaiting_payment → paid` healing
 * or an explicit verified break-glass override.
 */
export async function adminBookingLifecycleAction(
  _prev: AdminLifecycleActionState | undefined,
  formData: FormData,
): Promise<AdminLifecycleActionState> {
  const authUser = await requireRole("dispatcher");
  const client = await createServerSupabaseClient();

  const raw = {
    booking_id: emptyToUndefined(formData.get("booking_id")),
    expected_row_version: formData.get("expected_row_version"),
    next_status: emptyToUndefined(formData.get("next_status")),
    allow_no_op: false,
    actor_user_id: authUser.id,
    cancel_reason: emptyToUndefined(formData.get("cancel_reason")),
    assign_cleaner_id: emptyToUndefined(formData.get("assign_cleaner_id")),
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
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid form",
    };
  }

  if (!isBookingStatus(parsed.data.next_status)) {
    return { ok: false, code: "INVALID_STATUS", message: "Invalid target status" };
  }

  const bookingId = parsed.data.booking_id;
  const breakGlass = verifyReconciliationBreakGlass(formData);

  const [{ data: bookingSnap, error: bErr }, { data: payRows, error: pErr }] = await Promise.all([
    client.from("bookings").select("status").eq("id", bookingId).maybeSingle(),
    client.from("payments").select("status").eq("booking_id", bookingId),
  ]);

  if (bErr || pErr) {
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.RECONCILIATION,
      severity: "error",
      event: "staff.lifecycle.reconciliation.prefetch_failed",
      payload: {
        legacy_event: STAFF_LIFECYCLE_RECONCILIATION_EVENT,
        booking_id: bookingId,
        detail: bErr?.message ?? pErr?.message,
      },
    });
    return {
      ok: false,
      code: "DATABASE_ERROR",
      message: "Could not verify reconciliation state for this booking.",
    };
  }

  const bookingStatus = (bookingSnap as { status: string } | null)?.status ?? "";
  const paymentStatuses = ((payRows ?? []) as { status: string }[]).map((r) => r.status);

  const gate = assertStaffLifecycleReconciliationGate({
    bookingStatus,
    nextStatus: parsed.data.next_status,
    paymentStatuses,
    breakGlass,
  });

  if (!gate.ok) {
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.RECONCILIATION,
      severity: "warning",
      event: "staff.lifecycle.reconciliation.blocked",
      payload: {
        legacy_event: STAFF_LIFECYCLE_RECONCILIATION_EVENT,
        booking_id: bookingId,
        actor_user_id: authUser.id,
        requested_status: parsed.data.next_status,
        booking_status: bookingStatus,
        details: gate.details,
      },
    });
    return {
      ok: false,
      code: gate.code,
      message: gate.message,
    };
  }

  if (breakGlass) {
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.RECONCILIATION,
      severity: "critical",
      event: "staff.lifecycle.reconciliation.break_glass_override",
      payload: {
        legacy_event: STAFF_LIFECYCLE_RECONCILIATION_EVENT,
        booking_id: bookingId,
        actor_user_id: authUser.id,
        requested_status: parsed.data.next_status,
        booking_status: bookingStatus,
      },
    });
  } else if (gate.details.allowed_under_divergence) {
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.RECONCILIATION,
      severity: "info",
      event: "staff.lifecycle.reconciliation.healing_allowed",
      payload: {
        legacy_event: STAFF_LIFECYCLE_RECONCILIATION_EVENT,
        booking_id: bookingId,
        actor_user_id: authUser.id,
        requested_status: parsed.data.next_status,
      },
    });
  }

  const result = await updateBookingStatus(client, parsed.data);

  if (!result.ok) {
    const sev =
      result.code === "ROW_VERSION_MISMATCH"
        ? ("warning" as const)
        : result.code === "LIFECYCLE_VIOLATION" || result.code === "AUTHORIZATION_DENIED"
          ? ("warning" as const)
          : ("error" as const);
    const cat =
      result.code === "ROW_VERSION_MISMATCH"
        ? MONITORING_CATEGORY.CONCURRENCY
        : result.code === "LIFECYCLE_VIOLATION"
          ? MONITORING_CATEGORY.LIFECYCLE
          : result.code === "AUTHORIZATION_DENIED"
            ? MONITORING_CATEGORY.AUTHORIZATION
            : MONITORING_CATEGORY.STAFF_OPS;
    emitMonitoringEvent({
      category: cat,
      severity: sev,
      event: "staff.lifecycle.update.failed",
      payload: {
        booking_id: bookingId,
        actor_user_id: authUser.id,
        code: result.code,
        next_status: parsed.data.next_status,
      },
    });
    if (result.code === "ROW_VERSION_MISMATCH") {
      return {
        ok: false,
        code: result.code,
        message:
          "Someone else saved changes first — reload this booking, confirm row version, then apply the transition again.",
      };
    }
    return {
      ok: false,
      code: result.code,
      message: result.message,
    };
  }

  revalidatePath(`/admin/operations/${bookingId}`);
  revalidatePath("/admin/operations");
  return { ok: true, message: "Saved." };
}

const appendOperationalNoteSchema = z.object({
  booking_id: z.string().uuid("Invalid booking"),
  note_kind: z.enum(["support", "operations"]),
  body: z.string().trim().min(1, "Enter a note").max(8000, "Note is too long"),
});

export type AppendOperationalNoteState = {
  ok: boolean;
  message?: string;
  code?: string;
};

/**
 * Append-only staff note on a booking (audit: author + created_at). Customers never see this stream.
 */
export async function appendBookingOperationalNoteAction(
  _prev: AppendOperationalNoteState | undefined,
  formData: FormData,
): Promise<AppendOperationalNoteState> {
  const authUser = await requireRole("dispatcher");
  const client = await createServerSupabaseClient();

  const parsed = appendOperationalNoteSchema.safeParse({
    booking_id: emptyToUndefined(formData.get("booking_id")),
    note_kind: emptyToUndefined(formData.get("note_kind")),
    body: String(formData.get("body") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid note",
    };
  }

  /* AppDatabase stub omits new tables until `supabase gen types` — payload matches booking_operational_notes migration. */
  const { error } = await client.from("booking_operational_notes").insert({
    booking_id: parsed.data.booking_id,
    author_user_id: authUser.id,
    note_kind: parsed.data.note_kind,
    body: parsed.data.body,
  } as never);

  if (error) {
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.STAFF_OPS,
      severity: "error",
      event: "support.booking_note.insert_failed",
      payload: {
        booking_id: parsed.data.booking_id,
        actor_user_id: authUser.id,
        detail: error.message,
      },
    });
    return { ok: false, code: "DATABASE_ERROR", message: error.message };
  }

  emitMonitoringEvent({
    category: MONITORING_CATEGORY.STAFF_OPS,
    severity: "info",
    event: "support.booking_note.created",
    payload: {
      booking_id: parsed.data.booking_id,
      actor_user_id: authUser.id,
      note_kind: parsed.data.note_kind,
    },
  });

  revalidatePath(`/admin/operations/${parsed.data.booking_id}`);
  return { ok: true, message: "Note saved." };
}
