import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  normalizeOperationalIdentity,
  type OperationalIdentity,
} from "./auth-normalizers";
import { logTemporaryRoleResolution } from "./role-debug";
import { readAppRoleFromUser, userHasAtLeastRole } from "./roles";
import type { AppRole, AuthenticatedUser } from "./types";

export async function getServerUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getServerSession(): Promise<{
  user: User | null;
  role: AppRole | null;
  identity: OperationalIdentity | null;
}> {
  const user = await getServerUser();
  if (!user) {
    return { user: null, role: null, identity: null };
  }
  const identity = normalizeOperationalIdentity(user);
  return { user, role: identity.role, identity };
}

export async function requireUser(): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  return { ...user, resolvedRole: readAppRoleFromUser(user) };
}

/** JWT must resolve to `admin` (centralized staff / destructive ops). */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  return requireRole("admin");
}

/**
 * Role gate for server-rendered surfaces. Uses the same `app_metadata.role` source as
 * {@link readAppRoleFromUser} (via {@link userHasAtLeastRole}).
 *
 * Wrong role → `redirect("/dashboard")` (authenticated but not allowed). Missing session
 * is handled by {@link requireUser} → `/login`. Keep middleware `PROTECTED_PREFIXES` in sync
 * with routes that call this so stale sessions hit `/login` before RSC prefetch, not mid-tree.
 */
export async function requireRole(min: AppRole): Promise<AuthenticatedUser> {
  const authUser = await requireAuthenticatedUser();
  const client = await createServerSupabaseClient();
  const allowed = userHasAtLeastRole(authUser, min);
  await logTemporaryRoleResolution({
    surface: "require_role",
    user: authUser,
    client,
    requireRoleMinimum: min,
    requireRoleAllowed: allowed,
    redirectReason: allowed ? "none" : "insufficient_role",
  });
  if (!allowed) {
    redirect("/dashboard");
  }
  return authUser;
}
