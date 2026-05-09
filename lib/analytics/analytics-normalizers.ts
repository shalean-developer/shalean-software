import type { AnalyticsEventRecord } from "./analytics-events";

export function normalizeAnalyticsEvent(row: Record<string, unknown>): AnalyticsEventRecord | null {
  if (
    typeof row.id !== "string" ||
    typeof row.event_kind !== "string" ||
    typeof row.window !== "string" ||
    typeof row.visibility !== "string" ||
    typeof row.formula !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    event_kind: row.event_kind as AnalyticsEventRecord["event_kind"],
    metric_kind:
      typeof row.metric_kind === "string"
        ? (row.metric_kind as AnalyticsEventRecord["metric_kind"])
        : null,
    score_kind:
      typeof row.score_kind === "string"
        ? (row.score_kind as AnalyticsEventRecord["score_kind"])
        : null,
    window: row.window as AnalyticsEventRecord["window"],
    visibility: row.visibility as AnalyticsEventRecord["visibility"],
    status:
      typeof row.status === "string"
        ? (row.status as AnalyticsEventRecord["status"])
        : "fresh",
    value: typeof row.value === "number" ? row.value : Number(row.value ?? 0),
    score:
      row.score === null || row.score === undefined
        ? null
        : typeof row.score === "number"
          ? row.score
          : Number(row.score),
    entity_kind: typeof row.entity_kind === "string" ? row.entity_kind : "analytics",
    entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
    booking_id: typeof row.booking_id === "string" ? row.booking_id : null,
    cleaner_id: typeof row.cleaner_id === "string" ? row.cleaner_id : null,
    customer_id: typeof row.customer_id === "string" ? row.customer_id : null,
    assignment_id: typeof row.assignment_id === "string" ? row.assignment_id : null,
    payment_id: typeof row.payment_id === "string" ? row.payment_id : null,
    formula: row.formula,
    inputs: row.inputs as AnalyticsEventRecord["inputs"],
    dimensions: row.dimensions as AnalyticsEventRecord["dimensions"],
    explanations: Array.isArray(row.explanations)
      ? row.explanations.filter((item): item is string => typeof item === "string")
      : [],
    metadata: row.metadata as AnalyticsEventRecord["metadata"],
    computed_at:
      typeof row.computed_at === "string" ? row.computed_at : new Date().toISOString(),
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export function normalizeAnalyticsEvents(rows: Record<string, unknown>[]): AnalyticsEventRecord[] {
  return rows.flatMap((row) => {
    const event = normalizeAnalyticsEvent(row);
    return event ? [event] : [];
  });
}
