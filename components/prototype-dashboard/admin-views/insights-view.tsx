"use client";

import { Activity, MapPinned, Repeat2, Sparkles, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import {
  ADMIN_AREA_UTILIZATION,
  ADMIN_BOOKING_MOMENTUM,
  ADMIN_INSIGHTS,
  ADMIN_SERVICE_MIX,
} from "../mock-admin-data";
import { adminChipClass, adminSectionClass } from "../admin-dashboard-ui";
import { AdminEmptyInsights } from "../admin-empty-states";
import { useAdminWorkflow, type AdminPeriod } from "../admin-workflow-context";

const PERIODS: { id: AdminPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "30 days" },
];

export function AdminInsightsView() {
  const { state, setPeriod, setExpandedArea, navigate, pushToast } = useAdminWorkflow();
  const period = state.insightsPeriod;
  const maxMomentum = Math.max(...ADMIN_BOOKING_MOMENTUM.map((d) => d.value));

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Insights</p>
          <h1 className="booking-display mt-1 text-[1.4rem] font-normal tracking-tight text-foreground sm:text-[1.55rem]">
            Operational intelligence
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Calm signals across the network — last {PERIODS.find((p) => p.id === period)?.label}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODS.map((p) => {
            const on = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod("insights", p.id)}
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
          <span className={adminChipClass("info")}>
            <Sparkles className="size-3" aria-hidden />
            Calm mode
          </span>
        </div>
      </div>

      {ADMIN_INSIGHTS.length === 0 ? (
        <AdminEmptyInsights />
      ) : null}

      <section className={cn(adminSectionClass({ priority: "hero" }), "p-4 sm:p-5")}>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {ADMIN_INSIGHTS.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() =>
                pushToast({
                  tone: "info",
                  title: row.label,
                  body: `${row.value} · ${row.changeLabel} · ${row.caption ?? ""}`,
                })
              }
              className="rounded-xl bg-background/70 px-3 py-3 text-left ring-1 ring-border/55 backdrop-blur-sm motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 hover:-translate-y-px hover:ring-primary/20"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{row.label}</p>
              <p className="mt-1 booking-display text-[1.45rem] font-normal leading-tight tracking-tight text-foreground">
                {row.value}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[11px] font-medium",
                  row.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500",
                )}
              >
                {row.changeLabel}
              </p>
              {row.caption ? (
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{row.caption}</p>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <section className={cn(adminSectionClass({ priority: "default" }))}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
            <TrendingUp className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
            Booking momentum
          </h2>
          <span className="text-[11px] text-muted-foreground">Visits / day</span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Daily visits this week — quick read.</p>
        <ul className="mt-3 grid grid-cols-7 gap-2">
          {ADMIN_BOOKING_MOMENTUM.map((d) => {
            const pct = Math.max(8, Math.round((d.value / maxMomentum) * 100));
            const isPeak = d.value === maxMomentum;
            return (
              <li key={d.day}>
                <button
                  type="button"
                  onClick={() =>
                    pushToast({
                      tone: "info",
                      title: `${d.day} momentum`,
                      body: `${d.value} visits${isPeak ? " · peak day" : ""}.`,
                    })
                  }
                  className="flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-2 hover:bg-muted/40"
                >
                  <div className="flex h-24 w-full items-end justify-center">
                    <div
                      className={cn(
                        "w-full max-w-[1.4rem] rounded-md motion-safe:transition-[height] motion-safe:duration-300",
                        isPeak ? "bg-primary" : "bg-primary/35",
                      )}
                      style={{ height: `${pct}%` }}
                      aria-hidden
                    />
                  </div>
                  <p className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">{d.day}</p>
                  <p className="text-[11px] tabular-nums text-foreground">{d.value}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className={cn(adminSectionClass({ priority: "default" }))}>
          <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
            <MapPinned className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
            Busiest areas
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Visits last 7 days · share of network.</p>
          <ul className="mt-3 space-y-2.5">
            {ADMIN_AREA_UTILIZATION.map((a) => {
              const expanded = state.expandedAreaId === a.area;
              return (
                <li key={a.area} className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setExpandedArea(expanded ? null : a.area)}
                    className="flex w-full items-baseline justify-between gap-2 rounded-lg px-1.5 py-1 text-left text-[12.5px] hover:bg-muted/40"
                  >
                    <span className="font-medium text-foreground">{a.area}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {a.visits} visits · {a.share}%
                    </span>
                  </button>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/45">
                    <div
                      className="h-full rounded-full bg-primary/80 motion-safe:transition-[width] motion-safe:duration-500"
                      style={{ width: `${a.share}%` }}
                      aria-hidden
                    />
                  </div>
                  {expanded ? (
                    <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
                      <p>
                        Avg cleaner utilisation in <span className="font-medium text-foreground">{a.area}</span>:
                        {" "}
                        {Math.min(95, 60 + a.share)}%
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("dispatch")}
                        className="mt-1 text-primary hover:underline"
                      >
                        Open dispatch lanes →
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <section className={cn(adminSectionClass({ priority: "default" }))}>
          <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
            <Activity className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
            Service mix
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Bookings by service this week.</p>
          <ul className="mt-3 space-y-2.5">
            {ADMIN_SERVICE_MIX.map((s) => (
              <li key={s.service} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                  <span className="font-medium text-foreground">{s.service}</span>
                  <span className="tabular-nums text-muted-foreground">{s.share}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/45">
                  <div
                    className="h-full rounded-full bg-primary/85"
                    style={{ width: `${s.share}%` }}
                    aria-hidden
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={cn(adminSectionClass({ priority: "quiet" }), "flex flex-wrap items-center gap-3")}>
        <Repeat2 className="size-4 shrink-0 text-primary/85" strokeWidth={1.7} aria-hidden />
        <p className="min-w-0 flex-1 text-[12.5px] text-muted-foreground">
          <span className="font-medium text-foreground">Recurring momentum</span> — 6 new recurring bookings this week
          across Sea Point and City Bowl.
        </p>
        <button
          type="button"
          onClick={() => navigate("bookings")}
          className={adminChipClass("info") + " cursor-pointer hover:bg-primary/15"}
        >
          +6 wow
        </button>
      </section>
    </div>
  );
}
