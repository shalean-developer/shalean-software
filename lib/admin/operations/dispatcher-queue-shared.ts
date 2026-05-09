import { OPS_THRESHOLDS } from "@/lib/analytics/thresholds";

/** Intelligence queues — filters are derived from bookings rows only (no parallel truth). */
export const DISPATCHER_QUEUE_IDS = [
  "needs_assignment",
  "awaiting_payment_48h",
  "awaiting_payment_24h",
  "stale_assigned",
  "stale_in_progress",
  "active_field",
] as const;

export type DispatcherQueueId = (typeof DISPATCHER_QUEUE_IDS)[number];

export function isDispatcherQueueId(v: string | null | undefined): v is DispatcherQueueId {
  return !!v && (DISPATCHER_QUEUE_IDS as readonly string[]).includes(v);
}

export type DispatcherBoardSort = "created_desc" | "scheduled_asc" | "updated_asc";

export function isDispatcherBoardSort(v: string | null | undefined): v is DispatcherBoardSort {
  return v === "created_desc" || v === "scheduled_asc" || v === "updated_asc";
}

export type DispatcherQueueCounts = {
  needs_assignment: number;
  awaiting_payment_stale_24h: number;
  awaiting_payment_stuck_48h: number;
  stale_assigned_72h: number;
  stale_in_progress_24h: number;
  /** assigned → in_progress rows (workload visibility). */
  active_field_pipeline: number;
  notification_outbox_failed: number;
};

export function dispatcherQueueThresholdIso(): {
  iso48hAwait: string;
  iso72hAssign: string;
  iso24hProg: string;
  iso24hAwaitWarn: string;
} {
  const now = Date.now();
  return {
    iso48hAwait: new Date(now - OPS_THRESHOLDS.AWAITING_PAYMENT_STUCK_HOURS * 3600000).toISOString(),
    iso72hAssign: new Date(now - OPS_THRESHOLDS.ASSIGNED_STUCK_HOURS * 3600000).toISOString(),
    iso24hProg: new Date(now - OPS_THRESHOLDS.IN_PROGRESS_STALE_HOURS * 3600000).toISOString(),
    iso24hAwaitWarn: new Date(now - OPS_THRESHOLDS.AWAITING_PAYMENT_WARN_HOURS * 3600000).toISOString(),
  };
}

export function dispatcherQueuePageTitle(id: DispatcherQueueId): string {
  switch (id) {
    case "needs_assignment":
      return "Paid — needs cleaner assignment";
    case "awaiting_payment_48h":
      return "Awaiting payment — idle over 48h";
    case "awaiting_payment_24h":
      return "Awaiting payment — idle over 24h";
    case "stale_assigned":
      return "Assigned — no progress over 72h";
    case "stale_in_progress":
      return "In progress — stalled over 24h";
    case "active_field":
      return "Active field pipeline — by visit time";
    default:
      return id;
  }
}

export function adminOperationsHref(opts: {
  queue?: DispatcherQueueId | null;
  status?: string | null;
  /** Omit or null to default board ordering (recent first). */
  sort?: DispatcherBoardSort | null;
  page?: number;
}): string {
  const qs = new URLSearchParams();
  if (opts.queue) qs.set("queue", opts.queue);
  if (opts.status && opts.status !== "all") qs.set("status", opts.status);
  if (opts.sort && opts.sort !== "created_desc") qs.set("sort", opts.sort);
  if (opts.page && opts.page > 1) qs.set("page", String(opts.page));
  const s = qs.toString();
  return s ? `/admin/operations?${s}` : "/admin/operations";
}
