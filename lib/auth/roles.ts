import type { User } from "@supabase/supabase-js";

import { APP_ROLES, type AppRole } from "./types";

/**
 * Reads role **only** from `app_metadata.role` (never `user_metadata`).
 * Unknown or missing values default to `customer` for the initial product phase.
 */
export function readAppRoleFromUser(user: User): AppRole {
  const raw = user.app_metadata?.role;
  if (typeof raw !== "string") {
    return "customer";
  }
  const normalized = raw.trim().toLowerCase();
  if ((APP_ROLES as readonly string[]).includes(normalized)) {
    return normalized as AppRole;
  }
  return "customer";
}

const ROLE_RANK: Record<AppRole, number> = {
  customer: 0,
  cleaner: 1,
  dispatcher: 2,
  admin: 3,
};

/** For future admin/cleaner routes: caller must have at least `min`. */
export function userHasAtLeastRole(user: User, min: AppRole): boolean {
  return ROLE_RANK[readAppRoleFromUser(user)] >= ROLE_RANK[min];
}

export function roleHasAtLeastRole(role: AppRole, min: AppRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
