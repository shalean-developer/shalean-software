import type { User } from "@supabase/supabase-js";

/**
 * Application roles (mirror `public.user_role` enum).
 * Authoritative source for **authorization** is `user.app_metadata.role` (server-set).
 */
export const APP_ROLES = [
  "customer",
  "cleaner",
  "dispatcher",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** Narrowed user + resolved role for server code. */
export type AuthenticatedUser = User & { resolvedRole: AppRole };

export type AuthActionState = {
  ok: boolean;
  message?: string;
  /**
   * On success, server returns this path and the **client** navigates (`router.replace`).
   * Avoids `redirect()` inside the same Server Action as `useActionState`, which can trigger
   * "An unexpected response was received from the server" on Next.js 16 + Turbopack.
   */
  navigateTo?: string;
};
