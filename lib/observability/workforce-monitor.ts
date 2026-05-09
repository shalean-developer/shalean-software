import type { WorkforceSeverity, WorkforceSignalKind } from "@/lib/workforce/workforce-signals";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("workforce");

export function recordWorkforceSignal(params: {
  kind: WorkforceSignalKind;
  severity: WorkforceSeverity;
  score: number;
  cleanerId?: string;
  bookingId?: string;
}): void {
  logger[params.severity === "critical" || params.severity === "high" ? "warn" : "info"]({
    event: "workforce.signal",
    ...params,
  });

  if (params.severity === "critical") {
    recordProductionSignal({
      area: "dispatch",
      status: "degraded",
      message: "Critical workforce intelligence signal detected.",
      metadata: params,
    });
  }
}

export function recordWorkforceFairnessDrift(params: {
  cleanerId?: string;
  fairnessScore: number;
  threshold: number;
}): void {
  logger[params.fairnessScore >= params.threshold ? "warn" : "info"]({
    event: "workforce.fairness_drift",
    ...params,
  });
}
