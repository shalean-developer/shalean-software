import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import {
  normalizeOperationalSession,
  type OperationalSession,
} from "./auth-normalizers";

export type OperationalAuthEventType =
  | "signed_in"
  | "signed_out"
  | "token_refreshed"
  | "role_changed"
  | "session_expired"
  | "user_updated"
  | "unknown";

export type OperationalAuthEvent = {
  type: OperationalAuthEventType;
  session: OperationalSession;
  occurredAt: number;
};

export function normalizeAuthEvent(
  event: AuthChangeEvent | string,
  session: Session | null,
): OperationalAuthEvent {
  const normalizedSession = normalizeOperationalSession(session);

  switch (event) {
    case "SIGNED_IN":
    case "INITIAL_SESSION":
      return {
        type: normalizedSession.status === "authenticated" ? "signed_in" : "signed_out",
        session: normalizedSession,
        occurredAt: Date.now(),
      };
    case "SIGNED_OUT":
      return {
        type: "signed_out",
        session: normalizeOperationalSession(null),
        occurredAt: Date.now(),
      };
    case "TOKEN_REFRESHED":
      return {
        type: "token_refreshed",
        session: normalizedSession,
        occurredAt: Date.now(),
      };
    case "USER_UPDATED":
      return {
        type: "user_updated",
        session: normalizedSession,
        occurredAt: Date.now(),
      };
    default:
      return {
        type: "unknown",
        session: normalizedSession,
        occurredAt: Date.now(),
      };
  }
}

export function createAuthDebugLogger(scope: string) {
  return (message: string, details?: unknown) => {
    if (process.env.NODE_ENV === "production") return;
    if (details === undefined) {
      console.debug(`[shalean:auth:${scope}] ${message}`);
    } else {
      console.debug(`[shalean:auth:${scope}] ${message}`, details);
    }
  };
}
