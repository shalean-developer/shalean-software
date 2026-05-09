import { createScopedLogger } from "./operational-logger";

const logger = createScopedLogger("production");

export type ProductionSignal = {
  area:
    | "startup"
    | "realtime"
    | "workflow"
    | "financial"
    | "dispatch"
    | "notifications"
    | "webhook"
    | "deployment"
    | "global_orchestration"
    | "self_healing"
    | "resilience_automation"
    | "optimization_safeguards"
    | "federated_governance";
  status: "ok" | "degraded" | "failed";
  message: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

export function recordProductionSignal(signal: ProductionSignal): void {
  const payload = {
    event: "production.signal",
    ...signal,
  };

  if (signal.status === "failed") {
    logger.error(payload);
  } else if (signal.status === "degraded") {
    logger.warn(payload);
  } else {
    logger.info(payload);
  }
}
