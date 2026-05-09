/**
 * Supabase integration boundary.
 *
 * These helpers provide infrastructure only: clients, env validation, and types.
 * Booking workflows and lifecycle mutations live in data-access/service modules.
 */

export type { AppDatabase } from "./env";
export { getSupabaseEnv, getSupabaseSecretKey } from "./env";
export { createBrowserSupabaseClient } from "./client";
export { createServerSupabaseClient } from "./server";
export { updateSession, type SessionUpdateResult } from "./middleware";

/** @deprecated Prefer `createServerSupabaseClient` (async, cookie-bound). */
export { createServerSupabaseClient as createSupabaseClient } from "./server";

/** @deprecated Prefer `createBrowserSupabaseClient`. */
export { createBrowserSupabaseClient as getSupabaseBrowserClient } from "./client";
