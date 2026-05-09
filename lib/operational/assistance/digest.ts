import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadDispatcherQueueCounts } from "@/lib/admin/operations/dispatcher-queue";
import { loadAdminAnalyticsSnapshot } from "@/lib/analytics/snapshot";
import type { AdminAnalyticsSnapshot } from "@/lib/analytics/types";
import type { AppDatabase } from "@/src/lib/supabase";

import { deriveQueueOperationalHints } from "./queue-assistance";
import type { OperationalHint } from "./types";

export type OperationalDigest = {
  generated_at: string;
  /** Combined queue + SLA-derived items */
  priorities: OperationalHint[];
  queue_health: OperationalHint[];
  workload_summary: string;
  incident_summary: OperationalHint[];
  analytics_ok: boolean;
  analytics_message?: string;
};

function hintsFromOpsHealth(s: AdminAnalyticsSnapshot): OperationalHint[] {
  const h = s.ops_health;
  const out: OperationalHint[] = [];
  if (h.stuck_awaiting_payment_48h >= 3) {
    out.push({
      id: "digest_stuck_await",
      severity: h.stuck_awaiting_payment_48h >= 8 ? "attention" : "info",
      category: "customer",
      title: "Awaiting payment — 48h+ idle",
      detail: `${h.stuck_awaiting_payment_48h} bookings in funnel window past the 48h idle threshold.`,
    });
  }
  if (h.stuck_assigned_72h >= 3) {
    out.push({
      id: "digest_stuck_assign",
      severity: "attention",
      category: "assignment",
      title: "Assigned — 72h without progression",
      detail: `${h.stuck_assigned_72h} bookings past assigned stall threshold.`,
    });
  }
  if (h.in_progress_stale_24h >= 2) {
    out.push({
      id: "digest_stale_ip",
      severity: h.in_progress_stale_24h >= 5 ? "attention" : "info",
      category: "recovery",
      title: "In progress — stale signals",
      detail: `${h.in_progress_stale_24h} in-progress rows stale over 24h.`,
    });
  }
  return out;
}

function hintsFromIncidents(s: AdminAnalyticsSnapshot): OperationalHint[] {
  const out: OperationalHint[] = [];
  for (const f of s.sla_surfaces) {
    out.push({
      id: `digest_sla_${f.id}`,
      severity: f.severity === "critical" ? "priority" : "attention",
      category: "recovery",
      title: f.severity === "critical" ? "Needs attention" : "Heads-up",
      detail: f.label,
    });
  }
  const fr = s.payments.failed_rate;
  const denom = s.payments.succeeded + s.payments.failed;
  if (fr !== null && fr > 0.15 && denom >= 8) {
    out.push({
      id: "digest_pay_fail_shape",
      severity: fr > 0.35 ? "priority" : "attention",
      category: "payment",
      title: "Payment failure rate (window)",
      detail: `Roughly ${Math.round(fr * 100)}% failures among ${denom} terminal attempts in funnel window.`,
    });
  }
  return out;
}

function buildWorkloadSummary(s: AdminAnalyticsSnapshot): string {
  const u = s.cleaners.utilization;
  const util =
    u.utilization_rate !== null ? `${Math.round(u.utilization_rate * 100)}% utilization (completed vs active cleaners)` : "utilization n/a";
  const cap = s.capacity_pressure;
  return `${s.funnel.bookings_created} bookings created · ${s.funnel.reached_paid_pipeline} reached paid+ pipeline · ${util} — ${cap.needs_assignment} paid unassigned · ${cap.active_field_pipeline} active field — funnel window ${s.funnel_window_days}d.`;
}

/** Read-only digest from analytics snapshot + dispatcher counts (no new metrics store). */
export async function loadOperationalDigest(
  client: SupabaseClient<AppDatabase>,
): Promise<OperationalDigest> {
  const generated_at = new Date().toISOString();
  const [analyticsResult, qCountsResult] = await Promise.all([
    loadAdminAnalyticsSnapshot(client),
    loadDispatcherQueueCounts(client),
  ]);

  if (!analyticsResult.ok) {
    const fallbackCounts = qCountsResult.ok ? qCountsResult.counts : null;
    const priorities =
      fallbackCounts !== null
        ? deriveQueueOperationalHints(fallbackCounts, 0)
        : [];
    return {
      generated_at,
      priorities,
      queue_health: [],
      workload_summary: "Analytics snapshot unavailable — queue hints only.",
      incident_summary: [],
      analytics_ok: false,
      analytics_message: analyticsResult.message,
    };
  }

  const snap = analyticsResult.snapshot;
  const counts = qCountsResult.ok ? qCountsResult.counts : null;
  const reconN = snap.reconciliation.divergent_payment_rows;

  const queueHints =
    counts !== null ? deriveQueueOperationalHints(counts, reconN) : deriveQueueOperationalHints(
      {
        needs_assignment: snap.capacity_pressure.needs_assignment,
        awaiting_payment_stale_24h: snap.ops_health.awaiting_payment_stale_24h,
        awaiting_payment_stuck_48h: snap.ops_health.stuck_awaiting_payment_48h,
        stale_assigned_72h: snap.ops_health.stuck_assigned_72h,
        stale_in_progress_24h: snap.ops_health.in_progress_stale_24h,
        active_field_pipeline: snap.capacity_pressure.active_field_pipeline,
        notification_outbox_failed: snap.notifications.failed,
      },
      reconN,
    );

  const slaHints = hintsFromIncidents(snap);
  const priorities = [...queueHints];
  for (const h of slaHints) {
    if (!priorities.some((p) => p.detail === h.detail)) priorities.push(h);
  }
  priorities.sort((a, b) => {
    const order = { priority: 0, attention: 1, info: 2 } as const;
    return order[a.severity] - order[b.severity];
  });

  return {
    generated_at,
    priorities,
    queue_health: hintsFromOpsHealth(snap),
    workload_summary: buildWorkloadSummary(snap),
    incident_summary: hintsFromIncidents(snap),
    analytics_ok: true,
  };
}
