import { OPS_THRESHOLDS } from "@/lib/analytics/thresholds";

import type { BookingAssistanceInput, OperationalHint } from "./types";

function hoursSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / 3600000;
}

const SEVERITY_ORDER: Record<OperationalHint["severity"], number> = {
  priority: 0,
  attention: 1,
  info: 2,
};

/** Context-aware guidance for a single booking — read-only heuristics. */
export function deriveBookingOperationalAssistance(input: BookingAssistanceInput): OperationalHint[] {
  const hints: OperationalHint[] = [];
  const { booking, payments, events, reconciliationConflict } = input;

  if (reconciliationConflict) {
    hints.push({
      id: "recon_conflict",
      severity: "priority",
      category: "recovery",
      title: "Payment verification alignment",
      detail:
        "A succeeded payment exists while the booking is not paid. Align verification before most other lifecycle moves.",
    });
  }

  const failedPay = payments.filter((p) => p.status === "failed");
  if (failedPay.length >= 2) {
    hints.push({
      id: "repeated_pay_fail",
      severity: "attention",
      category: "payment",
      title: "Repeated payment failures",
      detail: `${failedPay.length} failed attempts on record — customer may need an alternate path or follow-up per policy.`,
    });
  }

  if (booking.status === "awaiting_payment") {
    const h = hoursSince(booking.updated_at);
    if (h >= OPS_THRESHOLDS.AWAITING_PAYMENT_STUCK_HOURS) {
      hints.push({
        id: "await_stuck",
        severity: "priority",
        category: "customer",
        title: "Checkout idle beyond typical window",
        detail: `Roughly ${Math.round(h)}h since last activity — consider gentle outreach or clearing stale carts per playbook.`,
      });
    } else if (h >= OPS_THRESHOLDS.AWAITING_PAYMENT_WARN_HOURS) {
      hints.push({
        id: "await_warn",
        severity: "attention",
        category: "payment",
        title: "Awaiting payment longer than usual",
        detail: "Quiet for over 24h — monitor for abandonment risk alongside other awaiting_payment work.",
      });
    }
  }

  if (booking.status === "paid" && !booking.cleaner_id) {
    const sched = new Date(booking.scheduled_start).getTime();
    const hoursToVisit = (sched - Date.now()) / 3600000;
    if (Number.isFinite(hoursToVisit) && hoursToVisit > 0 && hoursToVisit < 48) {
      hints.push({
        id: "visit_soon_unassigned",
        severity: "attention",
        category: "assignment",
        title: "Visit approaching without assignment",
        detail:
          "Paid booking still needs a cleaner — weigh schedule proximity against active field workload when assigning.",
      });
    }
    const payEvt = events.find((e) => e.event_type === "PAYMENT_RECEIVED");
    const paidAgeHours = payEvt ? hoursSince(payEvt.created_at) : hoursSince(booking.updated_at);
    if (paidAgeHours >= 24) {
      hints.push({
        id: "paid_wait_assign",
        severity: "attention",
        category: "assignment",
        title: "Extended wait for assignment",
        detail:
          "Paid for some time without cleaner assignment — worth prioritizing among paid-unassigned queues when capacity allows.",
      });
    }
  }

  if (booking.status === "assigned" && booking.cleaner_id) {
    const hSinceUpd = hoursSince(booking.updated_at);
    const threshold = OPS_THRESHOLDS.ASSIGNED_STUCK_HOURS;
    if (hSinceUpd >= threshold * 0.67) {
      hints.push({
        id: "assigned_stall",
        severity: hSinceUpd >= threshold ? "priority" : "attention",
        category: "assignment",
        title: "Limited progression after assignment",
        detail:
          hSinceUpd >= threshold
            ? "Past the usual assigned stall window — consider cleaner contact or reassignment review (human decision)."
            : "Assignment is aging — confirm en-route or field signals soon.",
      });
    }
  }

  if (booking.status === "in_progress") {
    const hSinceUpd = hoursSince(booking.updated_at);
    if (hSinceUpd >= OPS_THRESHOLDS.IN_PROGRESS_STALE_HOURS) {
      hints.push({
        id: "inprog_stale",
        severity: "priority",
        category: "recovery",
        title: "In-progress signal staleness",
        detail:
          "Completion signals look stalled — verify with cleaner before forcing transitions; preserves lifecycle authority.",
      });
    }
  }

  hints.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return hints;
}
