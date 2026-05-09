import { createScopedLogger } from "./operational-logger";

const logger = createScopedLogger("incident");

export type IncidentRecord = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  area:
    | "auth"
    | "realtime"
    | "workflow"
    | "dispatch"
    | "messaging"
    | "notifications"
    | "financial"
    | "provider"
    | "deployment";
  title: string;
  status: "open" | "investigating" | "resolved";
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

export function recordIncident(incident: IncidentRecord): void {
  logger[incident.severity === "critical" || incident.severity === "high" ? "error" : "warn"]({
    event: "incident.recorded",
    ...incident,
  });
}

export function resolveIncident(id: string, metadata?: Record<string, unknown>): void {
  logger.info({
    event: "incident.resolved",
    id,
    metadata,
  });
}
