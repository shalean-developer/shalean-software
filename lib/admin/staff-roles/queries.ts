import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { readAppRoleFromUser } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/auth/types";
import type { AppDatabase } from "@/src/lib/supabase";
import { createServiceRoleSupabaseClient } from "@/src/lib/supabase/service";

export type StaffDirectoryRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  /** From JWT app_metadata (authorization truth). */
  jwt_role: AppRole;
  /** From public.users (operational mirror). */
  profile_role: AppRole | null;
};

export type StaffRoleAuditRow = {
  id: string;
  subject_user_id: string;
  previous_role: AppRole;
  new_role: AppRole;
  actor_user_id: string;
  reason: string | null;
  created_at: string;
};

function displayNameFromUserMeta(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null;
  for (const key of ["full_name", "name", "display_name"] as const) {
    const v = meta[key];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return null;
}

/**
 * Page of users for admin directory (Auth Admin API + profile role mirror).
 */
export async function listStaffDirectoryPage(opts: {
  page: number;
  perPage?: number;
}): Promise<
  | { ok: true; rows: StaffDirectoryRow[]; total: number | null; page: number; perPage: number }
  | { ok: false; message: string }
> {
  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    return { ok: false, message: "Service role is not configured (SUPABASE_SERVICE_ROLE_KEY)." };
  }

  const perPage = Math.min(100, Math.max(1, opts.perPage ?? 40));
  const page = Math.max(1, opts.page);

  const { data: listData, error: listErr } = await svc.auth.admin.listUsers({
    page,
    perPage,
  });

  if (listErr || !listData) {
    return { ok: false, message: listErr?.message ?? "Failed to list users" };
  }

  const users = listData.users;
  const ids = users.map((u) => u.id);
  if (ids.length === 0) {
    return {
      ok: true,
      rows: [],
      total: listData.total ?? null,
      page,
      perPage,
    };
  }

  const { data: profiles, error: profErr } = await svc
    .from("users")
    .select("id, role")
    .in("id", ids);

  if (profErr) {
    return { ok: false, message: profErr.message };
  }

  const roleById = new Map<string, AppRole>();
  for (const p of profiles ?? []) {
    const row = p as { id: string; role: string };
    if ((["customer", "cleaner", "dispatcher", "admin"] as const).includes(row.role as AppRole)) {
      roleById.set(row.id, row.role as AppRole);
    }
  }

  const rows: StaffDirectoryRow[] = users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    display_name: displayNameFromUserMeta(u.user_metadata as Record<string, unknown>),
    jwt_role: readAppRoleFromUser(u),
    profile_role: roleById.get(u.id) ?? null,
  }));

  return {
    ok: true,
    rows,
    total: listData.total ?? null,
    page,
    perPage,
  };
}

export async function countAdminProfiles(): Promise<{ ok: true; count: number } | { ok: false }> {
  const svc = createServiceRoleSupabaseClient();
  if (!svc) return { ok: false };

  const { count, error } = await svc
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");

  if (error || count === null) return { ok: false };
  return { ok: true, count };
}

/** Recent audit entries (session client; RLS allows admin JWT only). */
export async function listRecentStaffRoleAudit(
  client: SupabaseClient<AppDatabase>,
  limit: number,
): Promise<{ ok: true; rows: StaffRoleAuditRow[] } | { ok: false; message: string }> {
  const lim = Math.min(100, Math.max(1, limit));
  const { data, error } = await (client as SupabaseClient<Record<string, unknown>>)
    .from("staff_role_audit")
    .select("id, subject_user_id, previous_role, new_role, actor_user_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(lim);

  if (error) {
    return { ok: false, message: error.message };
  }

  const rows = (data ?? []) as StaffRoleAuditRow[];
  return { ok: true, rows };
}
