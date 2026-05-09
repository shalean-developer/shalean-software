"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";

export type RealtimeSubscriptionHandle = {
  channel: RealtimeChannel;
  unsubscribe: () => void;
};

export function createRealtimeDebugLogger(scope: string) {
  return (message: string, details?: unknown) => {
    if (process.env.NODE_ENV === "production") return;
    if (details === undefined) {
      console.debug(`[shalean:realtime:${scope}] ${message}`);
    } else {
      console.debug(`[shalean:realtime:${scope}] ${message}`, details);
    }
  };
}

export function createSubscriptionHandle(
  channel: RealtimeChannel,
): RealtimeSubscriptionHandle {
  return {
    channel,
    unsubscribe: () => {
      void channel.unsubscribe();
    },
  };
}

export function unsubscribeAll(handles: RealtimeSubscriptionHandle[]): void {
  for (const handle of handles) {
    handle.unsubscribe();
  }
}
