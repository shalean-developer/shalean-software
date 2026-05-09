import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { AppDatabase } from "./env";
import { getSupabaseEnv } from "./env";

/**
 * Request-scoped Supabase client for Server Components, Server Actions,
 * and Route Handlers. Uses the user's cookies so RLS remains authoritative.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient<AppDatabase>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server Components cannot mutate cookies; middleware handles refresh. */
        }
      },
    },
  });
}
