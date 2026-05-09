import type { AppRole } from "./types";

export type CanonicalOperationalRole = "customer" | "cleaner" | "admin";
export type OperationalPermission =
  | "booking:create"
  | "booking:read_own"
  | "booking:update_own"
  | "assignment:read_own"
  | "assignment:update_own"
  | "dispatch:read"
  | "dispatch:write"
  | "staff:manage"
  | "platform:observe";

export const ROLE_HOME_PATHS = {
  customer: "/dashboard",
  cleaner: "/cleaner/jobs",
  dispatcher: "/admin/operations",
  admin: "/admin/operations",
} as const satisfies Record<AppRole, string>;

export const ROLE_PERMISSIONS = {
  customer: ["booking:create", "booking:read_own", "booking:update_own"],
  cleaner: [
    "booking:read_own",
    "assignment:read_own",
    "assignment:update_own",
  ],
  dispatcher: [
    "dispatch:read",
    "dispatch:write",
    "platform:observe",
  ],
  admin: [
    "dispatch:read",
    "dispatch:write",
    "platform:observe",
    "staff:manage",
  ],
} as const satisfies Record<AppRole, readonly OperationalPermission[]>;

export function toCanonicalOperationalRole(role: AppRole): CanonicalOperationalRole {
  return role === "dispatcher" ? "admin" : role;
}

export function getRoleHomePath(role: AppRole): string {
  return ROLE_HOME_PATHS[role];
}

export function roleHasPermission(
  role: AppRole,
  permission: OperationalPermission,
): boolean {
  return (ROLE_PERMISSIONS[role] as readonly OperationalPermission[]).includes(permission);
}
