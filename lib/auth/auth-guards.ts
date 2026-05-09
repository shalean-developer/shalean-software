import type { NextRequest } from "next/server";

import { roleHasAtLeastRole } from "./roles";
import { getRoleHomePath } from "./role-contracts";
import type { AppRole, AuthenticatedUser } from "./types";

export type RouteAccessDecision =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "insufficient_role"; redirectTo: string };

const ROLE_PROTECTED_PREFIXES: Array<{ prefix: string; minRole: AppRole }> = [
  { prefix: "/admin", minRole: "dispatcher" },
  { prefix: "/api/admin", minRole: "dispatcher" },
  { prefix: "/cleaner", minRole: "cleaner" },
];

export function getRequiredRoleForPath(pathname: string): AppRole | null {
  const match = ROLE_PROTECTED_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.minRole ?? null;
}

export function canAccessPath(user: AuthenticatedUser, pathname: string): boolean {
  const minRole = getRequiredRoleForPath(pathname);
  return !minRole || roleHasAtLeastRole(user.resolvedRole, minRole);
}

export function getAuthenticatedRedirectPath(
  user: AuthenticatedUser,
  requestedPath?: string | null,
): string {
  if (requestedPath && canAccessPath(user, requestedPath)) {
    return requestedPath;
  }
  return getRoleHomePath(user.resolvedRole);
}

export function evaluateRouteAccess(params: {
  request: NextRequest;
  user: AuthenticatedUser | null;
  isProtected: boolean;
}): RouteAccessDecision {
  const { request, user, isProtected } = params;
  const pathname = request.nextUrl.pathname;

  if (!user && isProtected) {
    return {
      ok: false,
      reason: "unauthenticated",
      redirectTo: `/login?next=${encodeURIComponent(pathname)}`,
    };
  }

  if (!user) return { ok: true };

  const minRole = getRequiredRoleForPath(pathname);
  if (minRole && !roleHasAtLeastRole(user.resolvedRole, minRole)) {
    return {
      ok: false,
      reason: "insufficient_role",
      redirectTo: getRoleHomePath(user.resolvedRole),
    };
  }

  return { ok: true };
}
