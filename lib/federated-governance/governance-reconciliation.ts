import type { FederatedGovernanceEventRecord } from "./federated-governance-events";

export function federatedGovernanceDedupeKey(
  event: Pick<FederatedGovernanceEventRecord, "kind" | "region" | "domain" | "entity_kind" | "entity_id">,
): string {
  return [
    event.kind,
    event.region ?? "no_region",
    event.domain,
    event.entity_kind,
    event.entity_id ?? "no_entity",
  ].join(":");
}

export function mergeFederatedGovernanceEvents(
  current: FederatedGovernanceEventRecord[],
  incoming: FederatedGovernanceEventRecord[],
): FederatedGovernanceEventRecord[] {
  const byKey = new Map<string, FederatedGovernanceEventRecord>();
  for (const event of current) byKey.set(federatedGovernanceDedupeKey(event), event);
  for (const event of incoming) {
    const key = federatedGovernanceDedupeKey(event);
    const existing = byKey.get(key);
    if (!existing || Date.parse(event.created_at) >= Date.parse(existing.created_at)) {
      byKey.set(key, event);
    }
  }
  return [...byKey.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
