"use client";

import { useMemo } from "react";
import { AlertTriangle, Clock4, MapPin, Radar, Sparkles, UserSquare2, Users } from "lucide-react";

import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import {
  ADMIN_ALERTS,
  ADMIN_DAILY_CADENCE,
  ADMIN_DISPATCH_LABEL,
  ADMIN_DISPATCH_LANES,
  ADMIN_TODAY_HERO,
  type AdminDispatchSlot,
  type AdminDispatchSlotState,
} from "../mock-admin-data";
import { adminChipClass, adminSectionClass, type AdminChipVariant } from "../admin-dashboard-ui";
import { AdminEmptyAlerts, AdminEmptyDispatch } from "../admin-empty-states";
import { useAdminWorkflow } from "../admin-workflow-context";

const SLOT_CHIP: Record<AdminDispatchSlotState, AdminChipVariant> = {
  matched: "success",
  matching: "warn",
  conflict: "alert",
  unassigned: "muted",
};

const SLOT_TONE: Record<AdminDispatchSlotState, string> = {
  matched: "ring-emerald-500/25 bg-emerald-500/[0.04]",
  matching: "ring-amber-400/30 bg-amber-400/[0.05]",
  conflict: "ring-rose-500/30 bg-rose-500/[0.05]",
  unassigned: "ring-border/70 bg-card",
};

function DispatchSlotCard({ slot }: { slot: AdminDispatchSlot }) {
  const { openDetail, resolveConflict, markLate, pushToast } = useAdminWorkflow();
  return (
    <article
      className={cn(
        "rounded-xl p-3 ring-1 motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 motion-safe:hover:-translate-y-px",
        SLOT_TONE[slot.state],
      )}
    >
      <button
        type="button"
        onClick={() => openDetail({ kind: "slot", slotId: slot.id })}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(bpSectionHeading, "text-[14px]")}>{slot.serviceLabel}</p>
            <span className="text-[10.5px] font-medium tabular-nums text-muted-foreground">{slot.bookingRef}</span>
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{slot.customerName}</p>
        </div>
        <span className={adminChipClass(SLOT_CHIP[slot.state])}>{ADMIN_DISPATCH_LABEL[slot.state]}</span>
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock4 className="size-3.5 text-primary/80" strokeWidth={1.7} aria-hidden />
          {slot.timeLabel} · {slot.durationLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5 text-primary/80" strokeWidth={1.7} aria-hidden />
          {slot.area}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2">
        {slot.cleanerName ? (
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/12 text-[11px] font-semibold text-primary">
              {slot.cleanerInitials}
            </span>
            <p className="text-[12px] font-medium text-foreground">{slot.cleanerName}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[12px] text-amber-600 dark:text-amber-300">
            <AlertTriangle className="size-3.5" aria-hidden />
            Awaiting match
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {slot.state === "conflict" ? (
            <button
              type="button"
              onClick={() => resolveConflict(slot.id)}
              className="rounded-lg bg-primary px-2.5 py-1 text-[11.5px] font-medium text-primary-foreground motion-safe:transition-[background-color] hover:bg-primary/90"
            >
              Resolve
            </button>
          ) : slot.state !== "matched" ? (
            <button
              type="button"
              onClick={() => openDetail({ kind: "slot", slotId: slot.id })}
              className="rounded-lg bg-primary px-2.5 py-1 text-[11.5px] font-medium text-primary-foreground motion-safe:transition-[background-color] hover:bg-primary/90"
            >
              Match
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openDetail({ kind: "slot", slotId: slot.id })}
              className="rounded-lg bg-muted/30 px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color] hover:bg-muted/50"
            >
              Reassign
            </button>
          )}
          {slot.state === "matched" ? (
            <button
              type="button"
              onClick={() => markLate(slot.id)}
              className="rounded-lg bg-muted/30 px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color] hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-300"
            >
              Mark late
            </button>
          ) : null}
          <button
            type="button"
            onClick={() =>
              pushToast({ tone: "info", title: "Note saved", body: `${slot.bookingRef} · ops note added.` })
            }
            className="rounded-lg bg-muted/30 px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color] hover:bg-muted/50"
          >
            Notes
          </button>
        </div>
      </div>

      {slot.riskFlags && slot.riskFlags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {slot.riskFlags.map((flag) => (
            <span key={flag} className={adminChipClass("alert", "px-2 py-0.5 text-[10px]")}>{flag}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function AdminDispatchView() {
  const { state, openDetail, autoMatchQueue } = useAdminWorkflow();

  const lanes = useMemo(
    () =>
      ADMIN_DISPATCH_LANES.map((lane) => ({
        ...lane,
        slots: lane.slots.map((s) => state.slots[s.id] ?? s),
      })),
    [state.slots],
  );

  const totalSlots = lanes.reduce((n, lane) => n + lane.slots.length, 0);
  const queueCount = lanes.reduce(
    (n, lane) => n + lane.slots.filter((s) => s.state !== "matched").length,
    0,
  );

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Dispatch</p>
          <h1 className="booking-display mt-1 text-[1.4rem] font-normal tracking-tight text-foreground sm:text-[1.55rem]">
            Orchestration
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Assignments, conflicts, and matching across today&apos;s lanes.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={adminChipClass("muted")}>{totalSlots} slots</span>
          <span className={adminChipClass(queueCount > 0 ? "warn" : "success")}>
            {queueCount} pending
          </span>
        </div>
      </div>

      <section className={cn(adminSectionClass({ priority: "hero" }), "p-4 sm:p-5")}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: "Confirmed", value: ADMIN_DAILY_CADENCE.bookingsConfirmed, icon: Sparkles },
            { label: "Cleaners on duty", value: ADMIN_TODAY_HERO.cleanersActive, icon: Users },
            { label: "Matching", value: queueCount, icon: Radar },
            { label: "Attention", value: ADMIN_DAILY_CADENCE.bookingsAttention, icon: AlertTriangle },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-background/65 px-3 py-2.5 ring-1 ring-border/55 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{s.label}</p>
                <s.icon className="size-3.5 text-primary/80" strokeWidth={1.7} aria-hidden />
              </div>
              <p className="mt-0.5 booking-display text-[1.4rem] font-normal leading-tight tracking-tight tabular-nums text-foreground">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={cn(adminSectionClass({ priority: "emphasis" }))}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
            <AlertTriangle className="size-4 text-rose-500" strokeWidth={1.7} aria-hidden />
            Active alerts
          </h2>
          <span className={adminChipClass("muted")}>{ADMIN_ALERTS.length} open</span>
        </div>
        {ADMIN_ALERTS.length === 0 ? (
          <div className="mt-3">
            <AdminEmptyAlerts />
          </div>
        ) : null}
        <ul className="mt-2.5 space-y-1.5">
          {ADMIN_ALERTS.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1",
                alert.severity === "critical"
                  ? "bg-rose-500/[0.06] ring-rose-500/30"
                  : alert.severity === "warning"
                    ? "bg-amber-400/[0.08] ring-amber-400/30"
                    : "bg-primary/[0.05] ring-primary/20",
              )}
            >
              <button
                type="button"
                onClick={() => openDetail({ kind: "alert", alertId: alert.id })}
                className="flex min-w-0 flex-1 items-start gap-2 text-left"
              >
                <span
                  className={cn(
                    "mt-1 size-2 shrink-0 rounded-full",
                    alert.severity === "critical"
                      ? "bg-rose-500"
                      : alert.severity === "warning"
                        ? "bg-amber-500"
                        : "bg-primary",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-snug text-foreground">{alert.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{alert.detail}</p>
                </div>
              </button>
              {alert.cta ? (
                <button
                  type="button"
                  onClick={() => openDetail({ kind: "alert", alertId: alert.id })}
                  className="shrink-0 rounded-lg bg-background/80 px-2.5 py-1 text-[11.5px] font-medium text-primary ring-1 ring-primary/20 motion-safe:transition-[background-color,box-shadow] hover:bg-background hover:ring-primary/30"
                >
                  {alert.cta}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-3">
        {totalSlots === 0 ? (
          <AdminEmptyDispatch />
        ) : (
          lanes.map((lane) => (
            <section key={lane.id} className={cn(adminSectionClass({ priority: "default" }), "p-3 sm:p-4")}>
              <div className="flex items-center justify-between gap-2">
                <h2 className={cn(bpSectionHeading, "text-[14px]")}>{lane.label}</h2>
                <span className={adminChipClass("muted")}>{lane.slots.length}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {lane.slots.map((slot) => (
                  <DispatchSlotCard key={slot.id} slot={slot} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <section className={cn(adminSectionClass({ priority: "quiet" }), "flex flex-wrap items-center justify-between gap-3")}>
        <div className="flex items-start gap-2.5">
          <UserSquare2 className="mt-0.5 size-4 shrink-0 text-primary/85" strokeWidth={1.7} aria-hidden />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">Suggested matches</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Tariro N. · 2.1 km from SHL-2051 · 4★ recurring fit
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => autoMatchQueue()}
          className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground motion-safe:transition-[background-color,box-shadow] hover:bg-primary/90 active:scale-[0.98]"
        >
          Auto-match queue
        </button>
      </section>
    </div>
  );
}
