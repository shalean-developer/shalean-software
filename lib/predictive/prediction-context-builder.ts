import type { AppRole } from "@/lib/auth/types";
import type { Json } from "@/lib/database.types";

export type PredictionContextKind =
  | "sla_forecast"
  | "workforce_volatility"
  | "cancellation_reassignment"
  | "financial_forecast"
  | "operational_degradation";

export type PredictionContext = {
  kind: PredictionContextKind;
  actorRole: AppRole;
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
  customerId?: string;
  paymentId?: string;
  historyWindow: "day" | "week" | "month" | "quarter";
  historicalSignals: string[];
  metrics: Record<string, number>;
  sourceRefs: string[];
  redactions: string[];
  metadata?: Json;
};

const SENSITIVE_PATTERN = /(email|phone|address|token|secret|authorization|card|account)/i;

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_PATTERN.test(key)) return "[redacted]";
  if (Array.isArray(value)) return value.map((item) => redactValue(key, item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactValue(entryKey, entryValue),
      ]),
    );
  }
  return value;
}

export function buildPredictionContext(context: PredictionContext): PredictionContext {
  return {
    ...context,
    historicalSignals: context.historicalSignals.map((signal) =>
      signal.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]"),
    ),
    metadata: context.metadata ? (redactValue("metadata", context.metadata) as Json) : undefined,
  };
}

export function predictionContextVisibleToRole(context: PredictionContext, role: AppRole): boolean {
  if (role === "admin" || role === "dispatcher") return true;
  if (context.kind === "financial_forecast" || context.kind === "operational_degradation") return false;
  if (role === "cleaner") return Boolean(context.cleanerId || context.assignmentId);
  return context.kind === "cancellation_reassignment" || context.kind === "sla_forecast";
}
