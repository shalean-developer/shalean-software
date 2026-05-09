import type { ScaleReadinessInput } from "@/lib/scale/scale-events";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("scale");

export function recordScaleReadiness(event: ScaleReadinessInput): void {
  logger[event.status === "blocked" || event.status === "degraded" ? "warn" : "info"]({
    event: "scale.readiness",
    ...event,
  });

  if (event.status === "blocked" || event.severity === "critical") {
    recordProductionSignal({
      area: "deployment",
      status: "degraded",
      message: "Scale readiness requires operator attention.",
      metadata: {
        kind: event.kind,
        region: event.region,
        score: event.score,
        status: event.status,
      },
    });
  }
}

export function recordConsistencyLag(params: {
  region?: string | null;
  lagMs: number;
  maxLagMs: number;
  ok: boolean;
}): void {
  logger[params.ok ? "info" : "warn"]({
    event: "scale.consistency_lag",
    ...params,
  });
}
