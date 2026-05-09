export type ReconciliationIssue = {
  stream: "booking" | "assignment" | "message" | "notification" | "financial";
  entityId?: string;
  reason: string;
  observedAt: number;
};

export function detectOrderingGap<T extends { occurredAt: number; dedupeKey: string }>(
  events: T[],
): ReconciliationIssue[] {
  const issues: ReconciliationIssue[] = [];
  for (let i = 1; i < events.length; i += 1) {
    const previous = events[i - 1];
    const current = events[i];
    if (current.occurredAt < previous.occurredAt) {
      issues.push({
        stream: "booking",
        entityId: current.dedupeKey,
        reason: "Realtime event arrived older than the prior processed event.",
        observedAt: Date.now(),
      });
    }
  }
  return issues;
}

export function dedupeByKey<T extends { dedupeKey: string }>(events: T[]): T[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.dedupeKey)) return false;
    seen.add(event.dedupeKey);
    return true;
  });
}
