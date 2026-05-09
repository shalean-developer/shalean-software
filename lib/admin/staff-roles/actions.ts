"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/lib/auth/session";
import { readAppRoleFromUser } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/auth/types";
import { operationalLog } from "@/lib/operational/log";
import { emitMonitoringEvent, MONITORING_CATEGORY } from "@/lib/operational/monitoring";
import { createServiceRoleSupabaseClient } from "@/src/lib/supabase/service";

import { countAdminProfiles } from "./queries";
import { parseUpdateStaffRoleFromFormData } from "./schema";

export type StaffRoleActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function mergeAppMetadata(
  existing: Record<string, unknown> | undefined,
  role: AppRole,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...existing }
      : {};
  return { ...base, role };
}

/**
 * Admin-only: updates `auth.users` app_metadata.role via GoTrue Admin API.
 * `public.users.role` is synchronized by trigger `private.handle_auth_user_sync`.
 */
export async function updateStaffRoleAction(
  _prev: StaffRoleActionState | undefined,
  formData: FormData,
): Promise<StaffRoleActionState> {
  const actor = await requireAdmin();

  let parsed: ReturnType<typeof parseUpdateStaffRoleFromFormData>;
  try {
    parsed = parseUpdateStaffRoleFromFormData(formData);
  } catch {
    return { ok: false, message: "Invalid input." };
  }

  const { subject_user_id: subjectId, next_role: nextRole, reason } = parsed;

  if (subjectId === actor.id) {
    return { ok: false, message: "You cannot change your own role." };
  }

  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    return {
      ok: false,
      message: "Server misconfiguration: service role key is not set.",
    };
  }

  const { data: subjectAuth, error: fetchErr } = await svc.auth.admin.getUserById(subjectId);
  if (fetchErr || !subjectAuth?.user) {
    return { ok: false, message: fetchErr?.message ?? "User not found." };
  }

  const subjectUser = subjectAuth.user;
  const previousRole = readAppRoleFromUser(subjectUser);

  if (previousRole === nextRole) {
    return { ok: true, message: "No change — role already set." };
  }

  if (previousRole === "admin" && nextRole !== "admin") {
    const admins = await countAdminProfiles();
    if (admins.ok && admins.count <= 1) {
      return {
        ok: false,
        message: "Cannot demote the last admin account.",
      };
    }
  }

  const mergedMeta = mergeAppMetadata(
    subjectUser.app_metadata as Record<string, unknown> | undefined,
    nextRole,
  );

  const { error: updErr } = await svc.auth.admin.updateUserById(subjectId, {
    app_metadata: mergedMeta,
  });

  if (updErr) {
    operationalLog.error({
      event: "staff_role.update_failed",
      subject_user_id: subjectId,
      actor_user_id: actor.id,
      previous_role: previousRole,
      next_role: nextRole,
      detail: updErr.message,
    });
    return { ok: false, message: updErr.message };
  }

  const db = svc as unknown as SupabaseClient<Record<string, unknown>>;

  const { data: mirror, error: mirrorErr } = await db
    .from("users")
    .select("role")
    .eq("id", subjectId)
    .maybeSingle();

  const mirrorRole = (mirror as { role?: string } | null)?.role;
  if (!mirrorErr && mirrorRole && mirrorRole !== nextRole) {
    operationalLog.warn({
      event: "staff_role.profile_mirror_mismatch",
      subject_user_id: subjectId,
      expected_role: nextRole,
      public_users_role: mirrorRole,
      detail: "Trigger sync may be delayed or failed; investigate.",
    });
  }

  const auditPayload = {
    subject_user_id: subjectId,
    previous_role: previousRole,
    new_role: nextRole,
    actor_user_id: actor.id,
    reason: reason ?? null,
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- AppDatabase stub until generated types include staff_role_audit */
  const { error: auditErr } = await (db as any).from("staff_role_audit").insert(auditPayload);

  if (auditErr) {
    operationalLog.error({
      event: "staff_role.audit_insert_failed",
      ...auditPayload,
      detail: auditErr.message,
    });
    emitMonitoringEvent({
      category: MONITORING_CATEGORY.STAFF_OPS,
      severity: "error",
      event: "staff.role.audit_insert_failed",
      payload: {
        subject_user_id: subjectId,
        actor_user_id: actor.id,
      },
    });
  }

  operationalLog.info({
    event: "staff_role.updated",
    subject_user_id: subjectId,
    actor_user_id: actor.id,
    previous_role: previousRole,
    new_role: nextRole,
    reason_trimmed: reason?.slice(0, 120) ?? null,
  });

  emitMonitoringEvent({
    category: MONITORING_CATEGORY.STAFF_OPS,
    severity: "info",
    event: "staff.role.updated",
    payload: {
      subject_user_id: subjectId,
      actor_user_id: actor.id,
      previous_role: previousRole,
      new_role: nextRole,
    },
  });

  revalidatePath("/admin/staff/roles");
  return { ok: true, message: `Role updated to ${nextRole}. Subject must refresh session for JWT to reflect new role.` };
}
