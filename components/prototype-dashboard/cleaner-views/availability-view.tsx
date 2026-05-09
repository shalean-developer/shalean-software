"use client";

import { Check, MapPinned, PauseCircle, PlayCircle, PowerOff, Sparkles } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { cleanerSectionClass } from "../cleaner-dashboard-ui";
import { useCleanerWorkflow } from "../cleaner-workflow-context";
import type { AvailabilityStatus } from "../mock-cleaner-data";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COPY: Record<AvailabilityStatus, { title: string; subtitle: string }> = {
  online: {
    title: "You're online",
    subtitle: "Eligible for new assignments today.",
  },
  offline: {
    title: "You're offline",
    subtitle: "You won’t receive new offers.",
  },
  paused: {
    title: "Availability paused",
    subtitle: "Step away without losing your weekly pattern.",
  },
};

export function CleanerAvailabilityView() {
  const {
    availability,
    setAvailability,
    workingDays,
    toggleWorkingDay,
    preferredAreas,
    toggleArea,
    availableAreas,
    recurringPref,
    setRecurringPref,
  } = useCleanerWorkflow();

  const online = availability === "online";

  return (
    <div className="space-y-4">
      <div>
        <p className={bpOverline}>Availability</p>
        <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.48rem]">
          When you work
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Dispatch will respect this preview structure later.</p>
      </div>

      <section
        className={cn(
          cleanerSectionClass({ priority: "hero" }),
          "flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5",
        )}
      >
        <div>
          <h2 className={cn(bpSectionHeading, "text-[15px]")}>{STATUS_COPY[availability].title}</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">{STATUS_COPY[availability].subtitle}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={online}
          onClick={() => setAvailability(online ? "offline" : "online")}
          className={cn(
            "relative h-9 w-[3.25rem] shrink-0 rounded-full ring-1 transition-colors duration-200 motion-safe:transition-colors",
            online ? "bg-primary ring-primary/30" : "bg-muted/60 ring-border/80",
          )}
        >
          <span
            className={cn(
              "absolute top-1 size-7 rounded-full bg-background shadow-sm transition-transform duration-200 motion-safe:transition-transform",
              online ? "left-[calc(100%-1.75rem-0.25rem)]" : "left-1",
            )}
          />
          <span className="sr-only">Toggle online</span>
        </button>
      </section>

      <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
        <h2 className={cn(bpSectionHeading, "mb-3 text-[14px]")}>Status</h2>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "online", label: "Online", icon: PlayCircle },
              { id: "paused", label: "Paused", icon: PauseCircle },
              { id: "offline", label: "Offline", icon: PowerOff },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon;
            const on = availability === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={on}
                onClick={() => setAvailability(opt.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-semibold uppercase tracking-wide ring-1 motion-safe:transition-[background-color,color,transform] motion-safe:duration-200 active:scale-[0.97]",
                  on
                    ? "bg-primary/[0.1] text-primary ring-primary/40 shadow-[0_2px_12px_-5px_rgba(53,99,255,0.32)]"
                    : "bg-card text-muted-foreground ring-border/70 hover:bg-muted/45 hover:text-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={1.85} aria-hidden />
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "text-[14px]")}>Working days</h2>
          <p className="text-[11px] font-medium text-muted-foreground">
            {workingDays.length}/{ALL_DAYS.length} days
          </p>
        </div>
        <div role="group" aria-label="Working days" className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {ALL_DAYS.map((d) => {
            const on = workingDays.includes(d);
            return (
              <button
                key={d}
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Toggle ${d}`}
                onClick={() => toggleWorkingDay(d)}
                className={cn(
                  "group relative inline-flex min-h-10 flex-col items-center justify-center rounded-xl px-1 text-[12px] font-semibold leading-none tracking-tight",
                  "transition-[background-color,color,box-shadow,border-color,transform] duration-200 ease-out motion-reduce:transition-none touch-manipulation",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "motion-safe:active:scale-[0.96]",
                  on
                    ? "bg-primary/[0.1] text-primary ring-1 ring-primary/40 shadow-[0_2px_12px_-5px_rgba(53,99,255,0.32)] dark:bg-primary/[0.14] dark:ring-primary/45"
                    : "bg-card text-muted-foreground ring-1 ring-border/70 hover:bg-muted/45 hover:text-foreground hover:ring-primary/20",
                )}
              >
                <span>{d}</span>
                <span
                  aria-hidden
                  className={cn(
                    "mt-1 size-1 rounded-full transition-[opacity,transform,background-color] duration-200 ease-out motion-reduce:transition-none",
                    on ? "scale-100 bg-primary opacity-100" : "scale-50 bg-transparent opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
        <h2 className={cn(bpSectionHeading, "mb-3 flex items-center gap-2 text-[14px]")}>
          <MapPinned className="size-4 text-primary/85" strokeWidth={1.65} aria-hidden />
          Preferred areas
        </h2>
        <ul className="flex flex-wrap gap-1.5">
          {availableAreas.map((a) => {
            const on = preferredAreas.includes(a);
            return (
              <li key={a}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleArea(a)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.97]",
                    on
                      ? "bg-primary/[0.08] text-primary ring-primary/30 shadow-[0_2px_10px_-6px_rgba(53,99,255,0.4)]"
                      : "bg-muted/30 text-muted-foreground ring-border/70 hover:bg-muted/55 hover:text-foreground",
                  )}
                >
                  {on ? <Check className="size-3" strokeWidth={2.4} aria-hidden /> : null}
                  {a}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] text-muted-foreground">{preferredAreas.length} selected · tap to toggle</p>
      </section>

      <section className={cn(cleanerSectionClass({ priority: "emphasis" }), "space-y-3 p-4 sm:p-5")}>
        <h2 className={cn(bpSectionHeading, "flex items-center gap-2 text-[14px]")}>
          <PauseCircle className="size-4 text-primary/85" strokeWidth={1.65} aria-hidden />
          Pause availability
        </h2>
        <p className="text-[13px] text-muted-foreground">Step away without changing your weekly pattern.</p>
        <Button
          type="button"
          variant={availability === "paused" ? "default" : "outline"}
          className="w-full touch-manipulation rounded-xl sm:w-auto"
          onClick={() => setAvailability(availability === "paused" ? "online" : "paused")}
        >
          {availability === "paused" ? "Resume now" : "Pause for 48 hours"}
        </Button>
      </section>

      <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
        <h2 className={cn(bpSectionHeading, "mb-3 flex items-center gap-2 text-[14px]")}>
          <Sparkles className="size-4 text-primary/85" strokeWidth={1.65} aria-hidden />
          Recurring preference
        </h2>
        <div className="flex flex-col gap-2">
          {(
            [
              ["open", "Open to new recurring homes"],
              ["same_clients", "Prefer same clients when possible"],
              ["light", "Light recurring load only"],
            ] as const
          ).map(([key, label]) => {
            const on = recurringPref === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => setRecurringPref(key)}
                className={cn(
                  buttonVariants({ variant: on ? "default" : "outline", size: "sm" }),
                  "h-11 w-full justify-start rounded-xl text-left text-[13px] font-medium",
                )}
              >
                {on ? <Check className="size-3.5" aria-hidden /> : null}
                {label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
