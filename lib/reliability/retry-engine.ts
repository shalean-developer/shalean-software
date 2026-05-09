import { normalizeFailure, type NormalizedFailure } from "./failure-normalizers";

export type RetryPolicy = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  shouldRetry?: (failure: NormalizedFailure, attempt: number) => boolean;
  onAttempt?: (event: RetryAttemptEvent) => void;
};

export type RetryAttemptEvent = {
  attempt: number;
  delayMs: number;
  failure?: NormalizedFailure;
  exhausted: boolean;
};

export type RetryResult<T> =
  | { ok: true; data: T; attempts: number }
  | { ok: false; failure: NormalizedFailure; attempts: number };

export function computeRetryDelay(attempt: number, policy?: RetryPolicy): number {
  const base = policy?.baseDelayMs ?? 500;
  const max = policy?.maxDelayMs ?? 10_000;
  const jitterRatio = policy?.jitterRatio ?? 0.2;
  const raw = Math.min(max, base * 2 ** Math.max(0, attempt - 1));
  const jitter = raw * jitterRatio * Math.random();
  return Math.round(raw + jitter);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  policy?: RetryPolicy,
): Promise<RetryResult<T>> {
  const maxAttempts = Math.max(1, policy?.maxAttempts ?? 3);
  let lastFailure: NormalizedFailure = {
    kind: "unknown",
    message: "Operation did not run",
    retryable: false,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const data = await operation();
      return { ok: true, data, attempts: attempt };
    } catch (error) {
      lastFailure = normalizeFailure(error);
      const exhausted = attempt >= maxAttempts;
      const shouldRetry = policy?.shouldRetry?.(lastFailure, attempt) ?? lastFailure.retryable;
      const delayMs = exhausted || !shouldRetry ? 0 : computeRetryDelay(attempt, policy);
      policy?.onAttempt?.({ attempt, delayMs, failure: lastFailure, exhausted });
      if (exhausted || !shouldRetry) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { ok: false, failure: lastFailure, attempts: maxAttempts };
}
