import "server-only";

import type { AdminAnalyticsSnapshot, DailyCount } from "./types";

/**
 * Interpretive trend labels — compare first vs second half of the daily series (UTC buckets).
 * Not forecasting; descriptive only (Stage 17).
 */
export type SeriesTrendInterpretation = "rising" | "falling" | "steady" | "unclear";

export type StrategicOperationalSummary = {
  booking_intake_trend: SeriesTrendInterpretation;
  payment_received_event_trend: SeriesTrendInterpretation;
  /** Short executive-style lines — all derived from the snapshot, no hidden models */
  interpretive_bullets: string[];
  /** Capacity / support saturation cues */
  throughput_notes: string[];
  /** Single-line maturity posture */
  maturity_headline: string;
};

function interpretDailySeriesTrend(
  series: DailyCount[],
  /** Relative change between halves to exceed for rising/falling */
  threshold = 0.12,
): SeriesTrendInterpretation {
  if (series.length < 6) return "unclear";
  const mid = Math.floor(series.length / 2);
  const first = series.slice(0, mid).reduce((s, x) => s + x.count, 0);
  const second = series.slice(mid).reduce((s, x) => s + x.count, 0);
  const denom = Math.max(first, second, 1);
  const delta = (second - first) / denom;
  if (delta > threshold) return "rising";
  if (delta < -threshold) return "falling";
  return "steady";
}

function trendPhrase(label: string, t: SeriesTrendInterpretation): string {
  switch (t) {
    case "rising":
      return `${label} is higher in the more recent half of the trend window than the earlier half — monitor queues if intake outpaces assignment capacity.`;
    case "falling":
      return `${label} is lower in the recent half-window — could reflect seasonality or funnel friction; pair with payment and cancellation rates.`;
    case "steady":
      return `${label} is roughly steady across the trend window halves.`;
    default:
      return `${label} trend is unclear (short window or flat noise) — rely on absolute counts and Monitoring lists.`;
  }
}

/**
 * Strategic, non-predictive narrative from an analytics snapshot.
 */
export function deriveStrategicOperationalSummary(s: AdminAnalyticsSnapshot): StrategicOperationalSummary {
  const booking_intake_trend = interpretDailySeriesTrend(s.daily_bookings_created);
  const payment_received_event_trend = interpretDailySeriesTrend(s.daily_payment_received_events);

  const interpretive_bullets: string[] = [
    trendPhrase("Booking intake (UTC day buckets)", booking_intake_trend),
    trendPhrase("Payment-received events (booking_events)", payment_received_event_trend),
  ];

  const { capacity_pressure: cap, payments, notifications, cleaners, org_repeat_completions } = s;

  if (cap.needs_assignment >= 3) {
    interpretive_bullets.push(
      `${cap.needs_assignment} paid visit(s) still need assignment — dispatcher throughput may be the limiting step.`,
    );
  }

  if (payments.failed_rate !== null && payments.failed_rate >= 0.12 && payments.succeeded + payments.failed >= 6) {
    interpretive_bullets.push(
      `Payment failure rate is elevated in the funnel window (${Math.round(payments.failed_rate * 100)}% of terminal attempts) — support and checkout friction merit attention.`,
    );
  }

  if (notifications.failure_rate !== null && notifications.failure_rate >= 0.08) {
    interpretive_bullets.push(
      `Notification terminal failure rate in-window is noticeable — email delivery may lag operational truth; customers still rely on bookings UI.`,
    );
  }

  if (cleaners.utilization.utilization_rate !== null && cleaners.utilization.utilization_rate >= 0.85) {
    interpretive_bullets.push(
      `Workforce utilization proxy is high — most active cleaners saw completions in the window; growth may need capacity before backlog builds.`,
    );
  }

  if (org_repeat_completions.repeat_share_among_completing_customers !== null) {
    const r = org_repeat_completions.repeat_share_among_completing_customers;
    interpretive_bullets.push(
      `Among customers with completions in-window, about ${Math.round(r * 100)}% had repeat completions in the sample — a retention shape signal, not revenue truth.`,
    );
  }

  const throughput_notes: string[] = [];
  if (s.ops_health.stuck_assigned_72h + s.ops_health.in_progress_stale_24h >= 4) {
    throughput_notes.push(
      "Field pipeline aging counts are elevated — assignment and in-progress queues deserve a pass alongside cleaner reality.",
    );
  }
  if (s.notifications.pending > 25) {
    throughput_notes.push(
      "Notification outbox pending depth is high — verify worker cadence before customer-perceived comms lag grows.",
    );
  }
  if (cap.active_field_pipeline >= 15) {
    throughput_notes.push(
      "Active field pipeline count is large relative to typical calm operations — sustained loads warrant roster review.",
    );
  }

  const crit = s.sla_surfaces.filter((x) => x.severity === "critical").length;
  const warn = s.sla_surfaces.filter((x) => x.severity === "warning").length;

  let maturity_headline: string;
  if (crit > 0) {
    maturity_headline =
      "Critical operational warnings are present — treat this snapshot as a prioritization signal and drill into Monitoring.";
  } else if (warn >= 2 || s.reconciliation.divergent_payment_rows > 0) {
    maturity_headline =
      "Routine maturity with active warnings — reconcile divergences and clear aging queues before scaling pushes.";
  } else {
    maturity_headline =
      "Operational posture looks calm for this window — keep sampling exports for leadership rhythm without adding new systems.";
  }

  return {
    booking_intake_trend,
    payment_received_event_trend,
    interpretive_bullets,
    throughput_notes,
    maturity_headline,
  };
}
