import "server-only";

import { operationalLog } from "./log";

/** High-level grouping for log drains, metrics, and alert rules. */
export const MONITORING_CATEGORY = {
  RECONCILIATION: "reconciliation",
  LIFECYCLE: "lifecycle",
  PAYMENTS: "payments",
  CONCURRENCY: "concurrency",
  AUTHORIZATION: "authorization",
  CLEANER_OPS: "cleaner_ops",
  STAFF_OPS: "staff_ops",
  SNAPSHOT: "snapshot_read",
  NOTIFICATION_OUTBOX: "notification_outbox",
} as const;

export type MonitoringCategory = (typeof MONITORING_CATEGORY)[keyof typeof MONITORING_CATEGORY];

export type MonitoringSeverity = "info" | "warning" | "error" | "critical";

function severityToLogLevel(
  severity: MonitoringSeverity,
): "info" | "warn" | "error" {
  if (severity === "info") return "info";
  if (severity === "warning") return "warn";
  return "error";
}

/**
 * Emits a single structured JSON line for operational monitoring (read-only callers).
 * Downstream: route to Datadog / CloudWatch / Axiom; alert on `severity` + `category`.
 */
export function emitMonitoringEvent(params: {
  category: MonitoringCategory;
  severity: MonitoringSeverity;
  /** Stable name for dashboards, e.g. `cleaner.lifecycle.denied`. */
  event: string;
  payload?: Record<string, unknown>;
}): void {
  const level = severityToLogLevel(params.severity);
  const body: Record<string, unknown> = {
    monitoring: true,
    monitoring_category: params.category,
    monitoring_severity: params.severity,
    monitoring_event: params.event,
    ...params.payload,
  };
  operationalLog[level === "info" ? "info" : level === "warn" ? "warn" : "error"](body);
}
