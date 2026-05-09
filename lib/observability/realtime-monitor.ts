import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const realtimeLogger = createScopedLogger("realtime");

export function recordRealtimeStatus(params: {
  status: string;
  attempts?: number;
  nextRetryAt?: number;
  error?: string;
}) {
  const level = params.status === "SUBSCRIBED" ? "info" : "warn";
  realtimeLogger[level]({
    event: "realtime.status",
    status: params.status,
    attempts: params.attempts ?? 0,
    next_retry_at: params.nextRetryAt ? new Date(params.nextRetryAt).toISOString() : null,
    error: params.error ?? null,
  });

  if (params.status !== "SUBSCRIBED" && (params.attempts ?? 0) >= 3) {
    recordProductionSignal({
      area: "realtime",
      status: "degraded",
      message: "Realtime subscription has repeated reconnect attempts.",
      metadata: {
        status: params.status,
        attempts: params.attempts ?? 0,
        next_retry_at: params.nextRetryAt,
      },
    });
  }
}
