import type { AutomationSeverity, OperationalSignalKind } from "@/lib/automation/operational-signals";

import { createScopedLogger } from "./operational-logger";
import { recordProductionSignal } from "./production-monitor";

const logger = createScopedLogger("automation");

export type AutomationSignalMetric = {
  kind: OperationalSignalKind;
  severity: AutomationSeverity;
  score: number;
  bookingId?: string;
  assignmentId?: string;
};

export function recordAutomationSignal(metric: AutomationSignalMetric): void {
  logger[metric.severity === "critical" || metric.severity === "high" ? "warn" : "info"]({
    event: "automation.signal",
    ...metric,
  });

  if (metric.severity === "critical") {
    recordProductionSignal({
      area: "dispatch",
      status: "degraded",
      message: "Critical automation signal detected.",
      metadata: metric,
    });
  }
}

export function recordAutomationRecommendation(params: {
  recommendationKind: string;
  accepted?: boolean;
  bookingId?: string;
  cleanerId?: string;
}): void {
  logger.info({
    event: "automation.recommendation",
    ...params,
  });
}
