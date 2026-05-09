"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import {
  normalizeAuthEvent,
  type OperationalAuthEvent,
} from "./auth-events";
import { normalizeOperationalSession } from "./auth-normalizers";

export function createAuthClient() {
  return createBrowserSupabaseClient().auth;
}

export async function getBrowserOperationalSession() {
  const auth = createAuthClient();
  const {
    data: { session },
  } = await auth.getSession();

  if (!session) {
    return normalizeOperationalSession(null);
  }

  const {
    data: { user },
    error,
  } = await auth.getUser();

  if (error || !user) {
    return normalizeOperationalSession(null);
  }

  return normalizeOperationalSession(session, user);
}

export function subscribeAuthEvents(
  handler: (event: OperationalAuthEvent) => void,
) {
  const auth = createAuthClient();
  const {
    data: { subscription },
  } = auth.onAuthStateChange((event, session) => {
    handler(normalizeAuthEvent(event, session));
  });

  return () => subscription.unsubscribe();
}
