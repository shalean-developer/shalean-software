/**
 * Route classification for middleware. Keep matchers simple and explicit.
 */

/** All authenticated app shells; must stay aligned with `(dashboard)` role-gated areas. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/account",
  "/bookings",
  "/admin",
  "/api/admin",
  "/cleaner",
] as const;

const AUTH_PATHNAMES = new Set(["/login", "/signup"]);

/** OAuth / magic-link exchange — must run while cookies are being established. */
export const AUTH_CALLBACK_PATH = "/auth/callback";

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_PATHNAMES.has(pathname);
}

export function isAuthCallbackRoute(pathname: string): boolean {
  return pathname === AUTH_CALLBACK_PATH || pathname.startsWith(`${AUTH_CALLBACK_PATH}/`);
}
