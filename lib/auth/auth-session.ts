"use client";

import { useEffect, useState } from "react";

import {
  createAuthDebugLogger,
  type OperationalAuthEvent,
} from "./auth-events";
import {
  getBrowserOperationalSession,
  subscribeAuthEvents,
} from "./auth-client";
import {
  normalizeOperationalSession,
  type OperationalSession,
} from "./auth-normalizers";

export type AuthSessionState = {
  loading: boolean;
  session: OperationalSession;
  lastEvent: OperationalAuthEvent | null;
};

const anonymousSession = normalizeOperationalSession(null);

export async function hydrateOperationalSession(): Promise<OperationalSession> {
  return getBrowserOperationalSession();
}

export function subscribeOperationalAuthSession(params: {
  onSession: (session: OperationalSession, event: OperationalAuthEvent | null) => void;
  onDebug?: (message: string, details?: unknown) => void;
}) {
  const debug = params.onDebug ?? createAuthDebugLogger("session");
  let active = true;

  void hydrateOperationalSession().then((session) => {
    if (!active) return;
    debug("hydrated session", session.status);
    params.onSession(session, null);
  });

  const unsubscribe = subscribeAuthEvents((event) => {
    if (!active) return;
    debug(`auth event: ${event.type}`, event.session.identity?.role);
    params.onSession(event.session, event);
  });

  return () => {
    active = false;
    unsubscribe();
  };
}

export function useOperationalAuthSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    loading: true,
    session: anonymousSession,
    lastEvent: null,
  });

  useEffect(() => {
    return subscribeOperationalAuthSession({
      onSession: (session, event) => {
        setState({ loading: false, session, lastEvent: event });
      },
    });
  }, []);

  return state;
}
