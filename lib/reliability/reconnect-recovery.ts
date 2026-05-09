import { computeRetryDelay } from "./retry-engine";

export type RealtimeRecoveryState = {
  attempts: number;
  lastStatus?: string;
  lastError?: string;
  nextRetryAt?: number;
};

export function createRealtimeRecoveryState(): RealtimeRecoveryState {
  return { attempts: 0 };
}

export function noteRealtimeStatus(
  state: RealtimeRecoveryState,
  status: string,
  error?: unknown,
): RealtimeRecoveryState {
  const healthy = status === "SUBSCRIBED";
  const attempts = healthy ? 0 : state.attempts + 1;
  const delayMs = healthy ? 0 : computeRetryDelay(attempts, { baseDelayMs: 1_000, maxDelayMs: 30_000 });
  return {
    attempts,
    lastStatus: status,
    lastError: error instanceof Error ? error.message : error ? String(error) : undefined,
    nextRetryAt: healthy ? undefined : Date.now() + delayMs,
  };
}

export function shouldRecoverRealtime(state: RealtimeRecoveryState): boolean {
  return Boolean(state.nextRetryAt && Date.now() >= state.nextRetryAt);
}
