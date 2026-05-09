import "server-only";

import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { operationalLog } from "@/lib/operational/log";
import type { AppDatabase } from "@/src/lib/supabase";

import { readAppRoleFromUser } from "./roles";
import type { AppRole } from "./types";

/**
 * Production default: **off** (no noisy logs / fewer identifiers on stdout).
 * Non-production: on unless `TEMP_ROLE_DIAG_ENABLED=false`.
 * Production override (break-glass only): set `TEMP_ROLE_DIAG_ENABLED=true`.
 */
export const TEMP_ROLE_DIAG_ENABLED =
  process.env.NODE_ENV === "production"
    ? process.env.TEMP_ROLE_DIAG_ENABLED === "true"
    : process.env.TEMP_ROLE_DIAG_ENABLED !== "false";

const TEMP_ROLE_DIAG = "TEMP_ROLE_DIAG";

export type TempRoleDiagSurface =
  | "dashboard_layout"
  | "require_role"
  | "admin_operations_layout"
  | "admin_monitoring_page"
  | "admin_analytics_page"
  | "admin_support_hub_page"
  | "cleaner_jobs_page"
  | "cleaner_booking_detail_page";

function rawAppMetadataRole(user: User): string | null {
  const raw = user.app_metadata?.role;
  if (typeof raw === "string") return raw;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

async function fetchPublicUsersRole(
  client: SupabaseClient<AppDatabase>,
  userId: string,
): Promise<{ role: string | null; fetchFailed: boolean }> {
  const { data, error } = await client.from("users").select("role").eq("id", userId).maybeSingle();
  if (error) {
    return { role: null, fetchFailed: true };
  }
  const row = data as { role?: unknown } | null;
  const r = row?.role;
  return {
    role: typeof r === "string" ? r : null,
    fetchFailed: false,
  };
}

/**
 * Temporary stdout diagnostics for role resolution (remove after incident).
 * No secrets — ids and role strings only.
 */
export async function logTemporaryRoleResolution(params: {
  surface: TempRoleDiagSurface;
  user: User;
  client: SupabaseClient<AppDatabase>;
  requireRoleMinimum?: AppRole;
  requireRoleAllowed?: boolean;
  redirectReason?: "none" | "insufficient_role";
  /** Optional nav / guard context (plain booleans or strings only). */
  extra?: Record<string, string | boolean | null>;
}): Promise<void> {
  if (!TEMP_ROLE_DIAG_ENABLED) return;

  const { role: publicUsersRole, fetchFailed } = await fetchPublicUsersRole(
    params.client,
    params.user.id,
  );
  const resolvedRole = readAppRoleFromUser(params.user);

  operationalLog.info({
    scope: "temp_role_diag",
    [TEMP_ROLE_DIAG]: true,
    temp_role_surface: params.surface,
    auth_user_id: params.user.id,
    app_metadata_role: rawAppMetadataRole(params.user),
    public_users_role: publicUsersRole,
    public_users_role_fetch_failed: fetchFailed,
    resolved_role: resolvedRole,
    require_role_minimum: params.requireRoleMinimum ?? null,
    require_role_allowed: params.requireRoleAllowed ?? null,
    redirect_reason: params.redirectReason ?? "none",
    ...(params.extra ?? {}),
  });
}
