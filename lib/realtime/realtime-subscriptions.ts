"use client";

import type { User } from "@supabase/supabase-js";

import { hydrateOperationalSession } from "@/lib/auth/auth-session";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { RealtimeRecoveryState } from "@/lib/reliability";

import { subscribeToBookingRealtime } from "./booking-realtime";
import type { RealtimeSubscriptionHandle } from "./realtime-client";
import type { WorkflowRealtimeEvent } from "./types";

export type WorkflowRealtimeSubscription = {
  user: User;
  handle: RealtimeSubscriptionHandle;
};

export async function subscribeOperationalRealtime(params: {
  onEvent: (event: WorkflowRealtimeEvent) => void;
  onDebug?: (message: string, details?: unknown) => void;
  onRecoveryState?: (state: RealtimeRecoveryState) => void;
}): Promise<WorkflowRealtimeSubscription | null> {
  const client = createBrowserSupabaseClient();
  const session = await hydrateOperationalSession();

  if (session.status !== "authenticated") {
    params.onDebug?.("no authenticated realtime user");
    return null;
  }

  const handle = subscribeToBookingRealtime({
    client,
    userId: session.identity.id,
    role: session.identity.role,
    onEvent: params.onEvent,
    onDebug: params.onDebug,
    onRecoveryState: params.onRecoveryState,
  });

  return { user: session.user, handle };
}
