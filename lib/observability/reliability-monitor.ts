import type { NormalizedFailure } from "@/lib/reliability";

import { createScopedLogger } from "./operational-logger";

const reliabilityLogger = createScopedLogger("reliability");

export function recordRetryExhausted(params: {
  operation: string;
  attempts: number;
  failure: NormalizedFailure;
}) {
  reliabilityLogger.error({
    event: "retry.exhausted",
    operation: params.operation,
    attempts: params.attempts,
    failure_kind: params.failure.kind,
    retryable: params.failure.retryable,
    message: params.failure.message,
  });
}

export function recordReconciliationIssue(params: {
  stream: string;
  entityId?: string;
  reason: string;
}) {
  reliabilityLogger.warn({
    event: "reconciliation.issue",
    stream: params.stream,
    entity_id: params.entityId ?? null,
    reason: params.reason,
  });
}
