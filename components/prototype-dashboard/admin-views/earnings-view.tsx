"use client";

import { useMemo } from "react";
import { CreditCard, Repeat2, Sparkles, TrendingUp, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";
import { formatZar } from "@/components/booking-prototype/mock-pricing";

import {
  ADMIN_EARNINGS_HERO,
  ADMIN_PAYOUT_LABEL,
  ADMIN_REVENUE_LANES,
  type AdminPayoutStatus,
} from "../mock-admin-data";
import { adminChipClass, adminSectionClass, type AdminChipVariant } from "../admin-dashboard-ui";
import { AdminEmptyPayouts } from "../admin-empty-states";
import { useAdminWorkflow, type AdminPeriod } from "../admin-workflow-context";

const PAYOUT_CHIP: Record<AdminPayoutStatus, AdminChipVariant> = {
  scheduled: "info",
  released: "success",
  held: "warn",
};

const PERIODS: { id: AdminPeriod; label: string; multiplier: number }[] = [
  { id: "today", label: "Today", multiplier: 1 / 6 },
  { id: "week", label: "This week", multiplier: 1 },
  { id: "month", label: "This month", multiplier: 4.2 },
];

export function AdminEarningsView() {
  const { state, setPeriod, setPayoutStatus, openDetail, releaseAllScheduled, setExpandedRevenue } =
    useAdminWorkflow();
  const period = state.earningsPeriod;
  const periodCfg = PERIODS.find((p) => p.id === period) ?? PERIODS[1];

  const payouts = useMemo(() => Object.values(state.payouts), [state.payouts]);
  const totalScheduled = payouts.filter((p) => p.status === "scheduled").reduce((n, p) => n + p.amountZar, 0);
  const totalReleased = payouts.filter((p) => p.status === "released").reduce((n, p) => n + p.amountZar, 0);
  const totalHeld = payouts.filter((p) => p.status === "held").reduce((n, p) => n + p.amountZar, 0);

  const periodRevenue = Math.round(ADMIN_EARNINGS_HERO.weekRevenueZar * periodCfg.multiplier);
  const periodPayouts = Math.round(ADMIN_EARNINGS_HERO.payoutsScheduledZar * periodCfg.multiplier);

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Earnings</p>
          <h1 className="booking-display mt-1 text-[1.4rem] font-normal tracking-tight text-foreground sm:text-[1.55rem]">
            Revenue &amp; payouts
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{periodCfg.label} performance and cleaner payout pipeline.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => {
            const on = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod("earnings", p.id)}
                aria-pressed={on}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1",
                  on
                    ? "bg-primary/[0.1] text-primary ring-primary/30"
                    : "bg-card text-muted-foreground ring-border/70 hover:bg-muted/45 hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className={cn(adminSectionClass({ priority: "hero" }), "p-4 sm:p-5 md:p-6")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: `${periodCfg.label} revenue`,
              value: formatZar(periodRevenue),
              caption: ADMIN_EARNINGS_HERO.weekRevenueTrendLabel,
              icon: TrendingUp,
              tone: "primary" as const,
            },
            {
              label: "Recurring share",
              value: ADMIN_EARNINGS_HERO.recurringShareLabel,
              caption: "Subscriptions of total",
              icon: Repeat2,
              tone: "muted" as const,
            },
            {
              label: "Payouts queued",
              value: formatZar(Math.max(totalScheduled, periodPayouts)),
              caption: ADMIN_EARNINGS_HERO.payoutsScheduledLabel,
              icon: Wallet,
              tone: "muted" as const,
            },
            {
              label: "Cleaner share",
              value: ADMIN_EARNINGS_HERO.cleanerCutLabel,
              caption: "Net of platform fee",
              icon: CreditCard,
              tone: "muted" as const,
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                "rounded-xl px-3.5 py-3 ring-1",
                s.tone === "primary"
                  ? "bg-background/70 ring-primary/20"
                  : "bg-background/55 ring-border/55",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{s.label}</p>
                <s.icon className="size-3.5 text-primary/85" strokeWidth={1.7} aria-hidden />
              </div>
              <p className="mt-1 booking-display text-[1.35rem] font-normal leading-tight tracking-tight text-foreground">
                {s.value}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{s.caption}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={cn(adminSectionClass({ priority: "default" }))}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Service revenue mix</h2>
          <span className={adminChipClass("muted")}>{periodCfg.label}</span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{periodCfg.label} revenue across services.</p>
        <ul className="mt-3 space-y-2.5">
          {ADMIN_REVENUE_LANES.map((row) => {
            const expanded = state.expandedRevenueId === row.label;
            return (
              <li key={row.label} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setExpandedRevenue(expanded ? null : row.label)}
                  className="flex w-full items-baseline justify-between gap-2 rounded-lg px-1.5 py-1 text-left text-[12.5px] hover:bg-muted/40"
                >
                  <span className="font-medium text-foreground">{row.label}</span>
                  <span className="tabular-nums text-foreground">{row.valueLabel}</span>
                </button>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/45">
                  <div
                    className="h-full rounded-full bg-primary/85 motion-safe:transition-[width] motion-safe:duration-500"
                    style={{ width: `${row.share}%` }}
                    aria-hidden
                  />
                </div>
                {expanded ? (
                  <p className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
                    {row.share}% of {periodCfg.label.toLowerCase()} mix · trending {row.share > 25 ? "↑" : "→"}
                  </p>
                ) : (
                  <p className="text-[10.5px] text-muted-foreground">{row.share}% of mix · tap for detail</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={cn(adminSectionClass({ priority: "default" }))}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Cleaner payouts</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={adminChipClass("info")}>{formatZar(totalScheduled)} scheduled</span>
            {totalReleased > 0 ? (
              <span className={adminChipClass("success")}>{formatZar(totalReleased)} released</span>
            ) : null}
            {totalHeld > 0 ? <span className={adminChipClass("warn")}>{formatZar(totalHeld)} held</span> : null}
            <button
              type="button"
              onClick={() => releaseAllScheduled()}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/25 motion-safe:transition-[background-color] hover:bg-primary/15"
            >
              <Sparkles className="size-3" aria-hidden />
              Release scheduled
            </button>
          </div>
        </div>
        {payouts.length === 0 ? (
          <div className="mt-3">
            <AdminEmptyPayouts />
          </div>
        ) : null}
        <ul className="mt-2.5 divide-y divide-border/55">
          {payouts.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => openDetail({ kind: "payout", payoutId: p.id })}
                className="flex min-w-0 items-start gap-2.5 text-left"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-[12px] font-semibold text-primary">
                  {p.initials}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium leading-tight text-foreground">{p.cleanerName}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">{p.periodLabel}</p>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-[13.5px] font-semibold tabular-nums text-foreground">{formatZar(p.amountZar)}</p>
                <span className={adminChipClass(PAYOUT_CHIP[p.status], "px-2 py-0.5 text-[10px]")}>
                  {ADMIN_PAYOUT_LABEL[p.status]}
                </span>
                <div className="hidden gap-1 sm:flex">
                  <button
                    type="button"
                    disabled={p.status === "released"}
                    onClick={() => setPayoutStatus(p.id, "released")}
                    className="rounded-md bg-muted/30 px-2 py-0.5 text-[10.5px] font-medium ring-1 ring-border/60 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Release
                  </button>
                  <button
                    type="button"
                    disabled={p.status === "held"}
                    onClick={() => setPayoutStatus(p.id, "held")}
                    className="rounded-md bg-muted/30 px-2 py-0.5 text-[10.5px] font-medium ring-1 ring-border/60 hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Hold
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

