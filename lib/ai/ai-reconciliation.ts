import type { AiAssistanceEventRecord } from "./ai-events";

export function aiAssistanceDedupeKey(
  event: Pick<AiAssistanceEventRecord, "kind" | "booking_id" | "assignment_id" | "cleaner_id" | "context_kind">,
): string {
  return [
    event.kind,
    event.context_kind,
    event.booking_id ?? "no_booking",
    event.assignment_id ?? "no_assignment",
    event.cleaner_id ?? "no_cleaner",
  ].join(":");
}

export function mergeAiAssistanceEvents(
  current: AiAssistanceEventRecord[],
  incoming: AiAssistanceEventRecord[],
): AiAssistanceEventRecord[] {
  const byKey = new Map<string, AiAssistanceEventRecord>();
  for (const event of current) byKey.set(aiAssistanceDedupeKey(event), event);
  for (const event of incoming) {
    const key = aiAssistanceDedupeKey(event);
    const existing = byKey.get(key);
    if (!existing || Date.parse(event.created_at) >= Date.parse(existing.created_at)) {
      byKey.set(key, event);
    }
  }
  return [...byKey.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
