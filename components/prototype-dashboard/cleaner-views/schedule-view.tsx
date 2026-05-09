"use client";

import { useState } from "react";
import { CalendarRange, ChevronRight, Repeat } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatZar } from "@/components/booking-prototype/mock-pricing";
import { bpHorizontalOptionPill, bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { DashboardStatusChip } from "../dashboard-status-chip";
import { cleanerSectionClass } from "../cleaner-dashboard-ui";
import { CleanerEmptyNoUpcoming } from "../cleaner-empty-states";
import { useCleanerWorkflow } from "../cleaner-workflow-context";
import {
  MOCK_RECURRING,
  MOCK_WEEK_SCHEDULE,
  VISIT_LIFECYCLE_LABEL,
  type ScheduleVisitStatus,
} from "../mock-cleaner-data";

type ScheduleMode = "day" | "week" | "recurring";

function StatusChip({ status }: { status: ScheduleVisitStatus }) {
  const label =
    status === "confirmed"
      ? "Confirmed"
      : status === "tentative"
        ? "Tentative"
        : status === "completed"
          ? "Done"
          : "Cancelled";
  const variant =
    status === "completed"
      ? ("neutral" as const)
      : status === "cancelled"
        ? ("neutral" as const)
        : ("booking" as const);
  return <DashboardStatusChip variant={variant}>{label}</DashboardStatusChip>;
}

export function CleanerScheduleView() {
  const [mode, setMode] = useState<ScheduleMode>("week");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const { openDetail, navigateAndFocusVisit, getLifecycle } = useCleanerWorkflow();

  const prototypeToday = MOCK_WEEK_SCHEDULE[MOCK_WEEK_SCHEDULE.length - 1]!;
  const daySlice = mode === "day" ? [prototypeToday] : MOCK_WEEK_SCHEDULE;

  const totalUpcoming = MOCK_WEEK_SCHEDULE.reduce((n, d) => n + d.visits.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <p className={bpOverline}>Schedule</p>
        <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.48rem]">
          Your week
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Scan times, areas, and recurring work.</p>
      </div>

      <div className="flex gap-1.5 rounded-xl bg-muted/35 p-1 ring-1 ring-border/70">
        {(
          [
            ["day", "Daily"],
            ["week", "Weekly"],
            ["recurring", "Recurring"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={cn(
              bpHorizontalOptionPill(mode === key),
              "flex-1 rounded-lg py-2.5 text-[12px] font-semibold sm:text-[13px]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "recurring" ? (
        <ul className="space-y-2">
          {MOCK_RECURRING.map((r, idx) => (
            <li key={r.serviceLabel + r.areaLabel}>
              <button
                type="button"
                onClick={() => openDetail({ kind: "recurring", index: idx })}
                className={cn(
                  cleanerSectionClass({ priority: "default" }),
                  "flex w-full items-start justify-between gap-3 p-4 text-left motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:scale-[0.99] sm:p-5",
                )}
              >
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Repeat className="size-3.5 text-primary/80" strokeWidth={1.75} aria-hidden />
                    {r.cadenceLabel}
                  </p>
                  <p className={cn(bpSectionHeading, "booking-display mt-1.5 text-[1.05rem] font-normal")}>
                    {r.serviceLabel}
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {r.areaLabel} · Next {r.nextDateLabel}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusChip status={r.status} />
                  <ChevronRight className="size-4 text-muted-foreground/70" aria-hidden />
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : totalUpcoming === 0 ? (
        <CleanerEmptyNoUpcoming />
      ) : (
        <div className="space-y-4">
          {daySlice.map((day) => {
            const expanded = expandedDay === day.dateLabel || mode === "day";
            const hasVisits = day.visits.length > 0;
            return (
              <section key={day.dateLabel}>
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "day") return;
                    setExpandedDay((cur) => (cur === day.dateLabel ? null : day.dateLabel));
                  }}
                  className={cn(
                    "mb-2 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left motion-safe:transition-colors motion-safe:duration-200",
                    mode === "week" && hasVisits && "hover:bg-muted/40",
                  )}
                  aria-expanded={mode === "week" ? expanded : undefined}
                >
                  <CalendarRange className="size-4 text-primary/80" strokeWidth={1.65} aria-hidden />
                  <h2 className="text-[13px] font-semibold tracking-tight text-foreground">{day.dateLabel}</h2>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {hasVisits ? `${day.visits.length} visit${day.visits.length === 1 ? "" : "s"}` : "Open day"}
                  </span>
                  {mode === "week" && hasVisits ? (
                    <ChevronRight
                      className={cn(
                        "ml-auto size-4 text-muted-foreground/60 motion-safe:transition-transform motion-safe:duration-200",
                        expanded && "rotate-90",
                      )}
                      aria-hidden
                    />
                  ) : null}
                </button>
                {!hasVisits ? (
                  <p
                    className={cn(
                      cleanerSectionClass({ priority: "quiet" }),
                      "px-4 py-6 text-[13px] text-muted-foreground",
                    )}
                  >
                    No visits.
                  </p>
                ) : expanded ? (
                  <ul className="space-y-2">
                    {day.visits.map((v) => {
                      const lifecycle = getLifecycle(v.id);
                      return (
                        <li key={v.id}>
                          <button
                            type="button"
                            onClick={() => openDetail({ kind: "visit", visitId: v.id })}
                            className={cn(
                              cleanerSectionClass({ priority: "default" }),
                              "flex w-full items-start justify-between gap-3 p-4 text-left motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:scale-[0.99] sm:p-5",
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-[15px] font-medium text-foreground">{v.serviceLabel}</p>
                              <p className="mt-1 text-[13px] text-muted-foreground">
                                {v.areaLabel} · {v.timeLabel}
                              </p>
                              <p className="mt-0.5 text-[12px] text-muted-foreground">
                                Estimated duration · {v.durationLabel}
                              </p>
                              {v.recurring ? (
                                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-primary/90">
                                  {v.recurringLabel}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <DashboardStatusChip variant="neutral">
                                {VISIT_LIFECYCLE_LABEL[lifecycle]}
                              </DashboardStatusChip>
                              <span className="text-[12px] text-muted-foreground">
                                {formatZar(v.estimateEarningsZar)} est.
                              </span>
                              <span className="mt-1 inline-flex items-center text-[10.5px] font-semibold uppercase tracking-wide text-primary/80">
                                Open
                                <ChevronRight className="ml-0.5 size-3" aria-hidden />
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateAndFocusVisit(v.id)}
                            className="mt-1 flex w-full items-center justify-end gap-1 px-1 text-[11px] font-semibold text-primary/85 motion-safe:transition-colors hover:text-primary"
                          >
                            Jump to active visit
                            <ChevronRight className="size-3" aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p
                    className={cn(
                      cleanerSectionClass({ priority: "quiet" }),
                      "px-4 py-3 text-[12px] text-muted-foreground",
                    )}
                  >
                    Tap to expand
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
