import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { AppDatabase } from "./env";
import { getSupabaseEnv, getSupabaseSecretKey } from "./env";

/**
 * Privileged server-only client for trusted workers/webhooks.
 * Never import this from Client Components or browser-reachable code.
 */
export function createServiceRoleSupabaseClient() {
  const key = getSupabaseSecretKey();
  if (!key) {
    return null;
  }

  const { url } = getSupabaseEnv();
  return createClient<AppDatabase>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
