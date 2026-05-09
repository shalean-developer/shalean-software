/**
 * Validates post-login `next` targets — internal path only, no open redirects.
 * Safe for middleware (Edge) and server actions.
 */
export function resolveSafeInternalRedirect(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const t = String(raw).trim();
  if (!t.startsWith("/") || t.startsWith("//")) return null;
  if (t.includes("\\")) return null;
  if (t.includes("\0")) return null;
  // Disallow scheme-relative or clever traversal
  if (t.includes("..")) return null;
  return t;
}
