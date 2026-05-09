import type { Json } from "@/lib/database.types";

import { computeQueueCapacitySignal, type CapacitySignal } from "./capacity-planning";
import { evaluateConsistencyLag } from "./consistency-guards";
import { getRegionTopology, isKnownRegion } from "./region-topology";
import type { ScaleReadinessInput } from "./scale-events";

export type ScaleReadinessReport = {
  ok: boolean;
  events: ScaleReadinessInput[];
  warnings: string[];
  errors: string[];
};

function eventFromCapacity(signal: CapacitySignal): ScaleReadinessInput {
  return {
    kind: signal.queue === "realtime_fanout" ? "realtime_fanout" : "capacity_pressure",
    status:
      signal.status === "ok"
        ? "ready"
        : signal.status === "watch"
          ? "observing"
          : signal.status === "degraded"
            ? "degraded"
            : "blocked",
    severity:
      signal.status === "blocked"
        ? "critical"
        : signal.status === "degraded"
          ? "high"
          : signal.status === "watch"
            ? "normal"
            : "low",
    entity_kind: signal.queue,
    score: signal.pressure,
    title: `${signal.queue} capacity`,
    summary: signal.explanation,
    inputs: signal.inputs as Json,
    recommendations:
      signal.status === "ok"
        ? []
        : ["Increase worker capacity, reduce fanout, or split workload before promoting more traffic."],
  };
}

export function evaluateScaleReadiness(input?: {
  pendingDispatch?: number;
  notificationBacklog?: number;
  activeRealtimeSubscriptions?: number;
  latestEventTimestamp?: string | number | null;
}): ScaleReadinessReport {
  const topology = getRegionTopology();
  const events: ScaleReadinessInput[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const knownRegion = isKnownRegion(topology, topology.currentRegion);
  if (!topology.primaryRegion) {
    warnings.push("SCALE_PRIMARY_REGION is not configured; multi-region topology is observational only.");
  }
  if (!knownRegion) {
    errors.push(`Current region ${topology.currentRegion ?? "unknown"} is not in SCALE_ALLOWED_REGIONS.`);
  }

  events.push({
    kind: "region_health",
    status: knownRegion ? "ready" : "blocked",
    severity: knownRegion ? "low" : "critical",
    region: topology.currentRegion,
    primary_region: topology.primaryRegion,
    entity_kind: "region",
    entity_id: topology.currentRegion,
    score: knownRegion ? 0.1 : 1,
    title: "Region topology",
    summary: knownRegion
      ? "Current deployment region is recognized by scale topology."
      : "Current deployment region is not recognized by scale topology.",
    inputs: {
      allowed_regions: topology.allowedRegions,
      current_region: topology.currentRegion,
      primary_region: topology.primaryRegion,
    },
    recommendations: knownRegion
      ? []
      : ["Add the deployment region to SCALE_ALLOWED_REGIONS or move traffic back to the primary region."],
  });

  events.push(
    eventFromCapacity(
      computeQueueCapacitySignal({
        queue: "booking_dispatch",
        pending: input?.pendingDispatch ?? 0,
        workers: Number.parseInt(process.env.SCALE_DISPATCH_WORKERS ?? "1", 10),
        targetPerWorker: Number.parseInt(process.env.SCALE_DISPATCH_TARGET_PER_WORKER ?? "25", 10),
      }),
    ),
  );

  events.push(
    eventFromCapacity(
      computeQueueCapacitySignal({
        queue: "notification_outbox",
        pending: input?.notificationBacklog ?? 0,
        workers: Number.parseInt(process.env.SCALE_NOTIFICATION_WORKERS ?? "1", 10),
        targetPerWorker: Number.parseInt(process.env.SCALE_NOTIFICATION_TARGET_PER_WORKER ?? "100", 10),
      }),
    ),
  );

  const consistency = evaluateConsistencyLag({
    sourceTimestamp: input?.latestEventTimestamp ?? Date.now(),
    maxLagMs: Number.parseInt(process.env.SCALE_CONSISTENCY_BUDGET_MS ?? "5000", 10),
  });
  if (!consistency.ok) warnings.push(consistency.explanation);
  events.push({
    kind: "consistency_lag",
    status: consistency.ok ? "ready" : "degraded",
    severity: consistency.ok ? "low" : "high",
    region: topology.currentRegion,
    primary_region: topology.primaryRegion,
    entity_kind: "event_stream",
    score: consistency.ok ? 0.1 : 0.8,
    title: "Operational event consistency",
    summary: consistency.explanation,
    inputs: { lag_ms: consistency.lagMs },
    recommendations: consistency.ok
      ? []
      : ["Route freshness-sensitive reads to primary infrastructure until lag recovers."],
  });

  return {
    ok: errors.length === 0 && events.every((event) => event.status !== "blocked"),
    events,
    warnings,
    errors,
  };
}
