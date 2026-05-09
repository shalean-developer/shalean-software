import { getRuntimeConfig } from "@/lib/runtime/runtime-config";

import { recordIncident } from "./incident-tracker";
import { createScopedLogger } from "./operational-logger";

const logger = createScopedLogger("error_reporting");

export type ProductionErrorCategory =
  | "auth_session"
  | "workflow_reconciliation"
  | "realtime_disconnect"
  | "financial_mismatch"
  | "assignment_conflict"
  | "provider_verification"
  | "webhook"
  | "deployment_startup";

export type ProductionErrorReport = {
  category: ProductionErrorCategory;
  message: string;
  error?: unknown;
  severity?: "low" | "medium" | "high" | "critical";
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

function normalizeError(error: unknown): Record<string, unknown> | undefined {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }
  return { value: String(error) };
}

export function captureProductionError(report: ProductionErrorReport): void {
  const config = getRuntimeConfig();
  const severity = report.severity ?? "medium";
  const payload = {
    event: "production.error",
    environment: config.environment,
    category: report.category,
    message: report.message,
    severity,
    correlationId: report.correlationId,
    error: normalizeError(report.error),
    metadata: report.metadata,
  };

  if (severity === "critical" || severity === "high") {
    logger.error(payload);
    recordIncident({
      id: report.correlationId ?? `${report.category}:${Date.now()}`,
      severity,
      area:
        report.category === "provider_verification"
          ? "provider"
          : report.category === "deployment_startup"
            ? "deployment"
            : report.category === "auth_session"
              ? "auth"
              : report.category === "assignment_conflict"
                ? "dispatch"
                : report.category === "financial_mismatch"
                  ? "financial"
                  : report.category === "realtime_disconnect"
                    ? "realtime"
                    : "workflow",
      title: report.message,
      status: "open",
      correlationId: report.correlationId,
      metadata: report.metadata,
    });
    return;
  }

  logger.warn(payload);
}
