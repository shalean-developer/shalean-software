"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { AppDatabase } from "./env";
import { getSupabaseEnv } from "./env";

let browserClient: ReturnType<typeof createBrowserClient<AppDatabase>> | undefined;

/**
 * Browser Supabase client with cookie session storage.
 * Keep business logic out of this layer; UI should call data-access helpers.
 */
export function createBrowserSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error(
      "createBrowserSupabaseClient() is browser-only. Use createServerSupabaseClient() on the server.",
    );
  }

  if (!browserClient) {
    const { url, publishableKey } = getSupabaseEnv();
    browserClient = createBrowserClient<AppDatabase>(url, publishableKey);
  }

  return browserClient;
}
