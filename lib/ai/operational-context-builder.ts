import type { AppRole } from "@/lib/auth/types";
import type { Json } from "@/lib/database.types";

export type AiOperationalContextKind =
  | "booking_summary"
  | "dispatch_context"
  | "workforce_snapshot"
  | "escalation_history"
  | "financial_summary"
  | "anomaly_context"
  | "shift_overview";

export type AiOperationalContext = {
  kind: AiOperationalContextKind;
  actorRole: AppRole;
  bookingId?: string;
  assignmentId?: string;
  cleanerId?: string;
  customerId?: string;
  title: string;
  facts: string[];
  metrics: Record<string, number>;
  sourceRefs: string[];
  redactions: string[];
  metadata?: Json;
};

const SENSITIVE_PATTERN = /(email|phone|address|token|secret|authorization|card|account)/i;

export function redactContextValue(key: string, value: unknown): unknown {
  if (SENSITIVE_PATTERN.test(key)) return "[redacted]";
  if (Array.isArray(value)) return value.map((item) => redactContextValue(key, item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactContextValue(entryKey, entryValue),
      ]),
    );
  }
  return value;
}

export function buildOperationalContext(input: AiOperationalContext): AiOperationalContext {
  return {
    ...input,
    facts: input.facts.map((fact) =>
      fact.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]"),
    ),
    metadata: input.metadata
      ? (redactContextValue("metadata", input.metadata) as Json)
      : undefined,
  };
}

export function contextVisibleToRole(context: AiOperationalContext, role: AppRole): boolean {
  if (role === "admin" || role === "dispatcher") return true;
  if (context.kind === "financial_summary" || context.kind === "dispatch_context") return false;
  if (role === "cleaner") return Boolean(context.cleanerId || context.assignmentId || context.bookingId);
  return context.kind === "booking_summary" || context.kind === "escalation_history";
}
