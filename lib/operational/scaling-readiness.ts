/**
 * Stage 16 — expansion readiness: **documentation and UI copy hooks only**.
 * Centralized lifecycle authority, `booking_events`, and RLS stay unchanged.
 */

/** When multi-region dispatch is introduced, group operational queues by this key (today: informational). */
export type OperationalRegionGroup = "default";

export const OPERATIONAL_REGION_COPY =
  "Regional partitions are not active yet — all lifecycle changes still flow through the centralized booking pipeline.";

export const SERVICE_CATEGORY_READINESS_COPY =
  "Additional service categories should reuse the same lifecycle states and booking_events stream; specialize in service metadata, not status forks.";

export const MULTI_TEAM_DISPATCH_COPY =
  "Future dispatcher separation should shard queue views and RBAC — not duplicate bookings or lifecycle emitters.";

export const FORECASTING_HOOKS_COPY =
  "Forecasting should consume scheduled starts, completion timestamps, and queue depth time series — no synthetic predictions stored as truth.";
