import { createScopedLogger } from "./operational-logger";

const logger = createScopedLogger("queue_health");

export type QueueHealthSignal = {
  queue: "notification_outbox" | "webhook_reconciliation" | "financial_payouts";
  pending: number;
  failed?: number;
  expiredLeases?: number;
  status: "ok" | "degraded" | "failed";
};

export function recordQueueHealth(signal: QueueHealthSignal): void {
  logger[signal.status === "ok" ? "info" : signal.status === "degraded" ? "warn" : "error"]({
    event: "queue.health",
    ...signal,
  });
}
