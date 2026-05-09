import type { Json } from "@/lib/database.types";
import { getRegionTopology } from "@/lib/scale";

import type { GlobalOrchestrationEventInput } from "./global-orchestration-events";
import { explainRoutingDecision, normalizeGlobalTopology } from "./topology-normalizers";

export function buildTopologySnapshotEvent(): GlobalOrchestrationEventInput {
  const topology = normalizeGlobalTopology();
  return {
    kind: "topology_snapshot",
    status: topology.knownCurrentRegion ? "coordinated" : "blocked",
    severity: topology.knownCurrentRegion ? "low" : "critical",
    origin_region: topology.currentRegion,
    target_region: topology.primaryRegion,
    primary_region: topology.primaryRegion,
    entity_kind: "global_topology",
    entity_id: topology.currentRegion,
    booking_id: null,
    assignment_id: null,
    cleaner_id: null,
    payment_id: null,
    title: "Global topology snapshot",
    summary: topology.summary,
    governance_action: topology.knownCurrentRegion
      ? "Keep routing through canonical orchestration contracts."
      : "Block regional promotion until topology is reconciled.",
    reasoning: [
      `Allowed regions: ${topology.allowedRegions.join(", ") || "not configured"}.`,
      `Canonical region count: ${topology.canonicalRegionCount}.`,
    ],
    source_refs: ["SCALE_PRIMARY_REGION", "SCALE_ALLOWED_REGIONS", "VERCEL_REGION"],
    recommendations: topology.knownCurrentRegion
      ? []
      : ["Add the deployment region to the allowed topology or route traffic back to primary."],
    metadata: topology as unknown as Json,
  };
}

export function coordinateRegionalWorkload(input: {
  entityKind: "booking_dispatch" | "notification_outbox" | "realtime_fanout" | "financial_settlement";
  entityId?: string | null;
  pending: number;
  capacity: number;
  targetRegion?: string | null;
}): GlobalOrchestrationEventInput {
  const topology = getRegionTopology();
  const pressure = input.capacity <= 0 ? 1 : Math.min(1, input.pending / input.capacity);
  const targetRegion = input.targetRegion ?? topology.primaryRegion;
  return {
    kind: "workload_balance",
    status: pressure >= 0.85 ? "review_required" : "coordinated",
    severity: pressure >= 0.85 ? "high" : pressure >= 0.55 ? "normal" : "low",
    origin_region: topology.currentRegion,
    target_region: targetRegion,
    primary_region: topology.primaryRegion,
    entity_kind: input.entityKind,
    entity_id: input.entityId ?? null,
    booking_id: null,
    assignment_id: null,
    cleaner_id: null,
    payment_id: null,
    title: "Regional workload coordination",
    summary: "Topology-aware workload signal recorded without moving ownership automatically.",
    governance_action:
      pressure >= 0.85
        ? "Review queue pressure before routing more work to this region."
        : "Continue routing through central orchestration contracts.",
    reasoning: explainRoutingDecision({
      originRegion: topology.currentRegion,
      targetRegion,
      primaryRegion: topology.primaryRegion,
      reason: `Workload pressure is ${pressure}.`,
    }),
    source_refs: ["scale_capacity", "queue_health", "global_orchestration"],
    recommendations:
      pressure >= 0.85
        ? ["Drain regional queue pressure before expanding traffic or moving failover ownership."]
        : [],
    metadata: { pending: input.pending, capacity: input.capacity, pressure },
  };
}
