import type { NormalizedFailure } from "./failure-normalizers";

export type ReliabilityEvent =
  | {
      type: "retry.attempted";
      operation: string;
      attempt: number;
      delayMs: number;
      failure?: NormalizedFailure;
    }
  | {
      type: "retry.exhausted";
      operation: string;
      attempts: number;
      failure: NormalizedFailure;
    }
  | {
      type: "realtime.recovery_scheduled";
      status: string;
      attempts: number;
      nextRetryAt?: number;
    }
  | {
      type: "reconciliation.mismatch";
      stream: string;
      entityId?: string;
      reason: string;
    };
