import type { PredictiveEventRecord } from "./predictive-events";

export function predictionDedupeKey(
  event: Pick<PredictiveEventRecord, "kind" | "context_kind" | "booking_id" | "assignment_id" | "cleaner_id" | "payment_id">,
): string {
  return [
    event.kind,
    event.context_kind,
    event.booking_id ?? "no_booking",
    event.assignment_id ?? "no_assignment",
    event.cleaner_id ?? "no_cleaner",
    event.payment_id ?? "no_payment",
  ].join(":");
}

export function mergePredictiveEvents(
  current: PredictiveEventRecord[],
  incoming: PredictiveEventRecord[],
): PredictiveEventRecord[] {
  const byKey = new Map<string, PredictiveEventRecord>();
  for (const event of current) byKey.set(predictionDedupeKey(event), event);
  for (const event of incoming) {
    const key = predictionDedupeKey(event);
    const existing = byKey.get(key);
    if (!existing || Date.parse(event.created_at) >= Date.parse(existing.created_at)) {
      byKey.set(key, event);
    }
  }
  return [...byKey.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
