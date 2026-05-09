"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { MockUpcomingBooking } from "./mock-customer-data";

const DEFAULT_STEPS = [
  { key: "booked", label: "Booked" },
  { key: "cleaner", label: "Team assigned" },
  { key: "arrival", label: "Arrival locked" },
  { key: "visit", label: "Visit ahead" },
] as const;

function stepsFor(booking: MockUpcomingBooking): readonly { key: string; label: string }[] {
  if (booking.cleanerStatus === "on_the_way") {
    return [
      { key: "booked", label: "Booked" },
      { key: "team", label: "Team assigned" },
      { key: "supplies", label: "Supplies ready" },
      { key: "enroute", label: "En route" },
    ];
  }
  if (booking.cleanerStatus === "pending") {
    return [
      { key: "booked", label: "Booked" },
      { key: "match", label: "Matching" },
      { key: "arrival", label: "Window TBC" },
      { key: "up", label: "Scheduled" },
    ];
  }
  return DEFAULT_STEPS;
}

function getStepStates(booking: MockUpcomingBooking): ("complete" | "current" | "upcoming")[] {
  if (booking.cleanerStatus === "on_the_way") {
    return ["complete", "complete", "complete", "current"];
  }
  if (booking.cleanerStatus === "pending") {
    return ["complete", "current", "upcoming", "upcoming"];
  }
  if (booking.cleanerStatus === "matched") {
    return ["complete", "complete", "complete", "current"];
  }
  return ["complete", "complete", "current", "upcoming"];
}

export function CustomerBookingTimeline({ booking }: { booking: MockUpcomingBooking }) {
  const steps = stepsFor(booking);
  const states = getStepStates(booking);

  return (
    <div
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-reduce:animate-none"
      role="list"
      aria-label="Booking progress"
    >
      <div className="flex items-start justify-between gap-0.5 sm:gap-2">
        {steps.map((step, i) => {
          const state = states[i]!;
          const prevComplete = i > 0 && states[i - 1] === "complete";

          return (
            <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" role="listitem">
              <div className="flex w-full items-center">
                {i > 0 ? (
                  <span
                    className={cn(
                      "h-px flex-1 min-[380px]:h-0.5 motion-safe:transition-colors motion-safe:duration-500",
                      prevComplete ? "bg-primary/50" : "bg-border/80",
                      state === "current" && prevComplete && "proto-dash-timeline-active-line",
                    )}
                    aria-hidden
                  />
                ) : (
                  <span className="w-1.5 shrink-0 sm:w-2.5" aria-hidden />
                )}
                <span
                  className={cn(
                    "relative flex size-6 shrink-0 items-center justify-center rounded-full motion-safe:transition-all motion-safe:duration-300 sm:size-7",
                    state === "complete" &&
                      "bg-primary/90 text-primary-foreground shadow-[0_2px_8px_-3px_rgba(53,99,255,0.35)] ring-1 ring-primary/20",
                    state === "current" &&
                      "bg-primary text-primary-foreground shadow-[0_2px_14px_-4px_rgba(53,99,255,0.45)] ring-2 ring-primary/30 ring-offset-2 ring-offset-background motion-safe:proto-dash-timeline-current-dot",
                    state === "upcoming" && "bg-muted/50 text-muted-foreground ring-1 ring-border/70",
                  )}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {state === "complete" ? (
                    <Check className="size-3 sm:size-3.5" strokeWidth={2.5} aria-hidden />
                  ) : state === "current" ? (
                    <span className="relative flex size-2 rounded-full bg-primary-foreground/95 motion-safe:animate-pulse motion-reduce:animate-none" />
                  ) : (
                    <span className="text-[10px] font-semibold tabular-nums sm:text-[11px]">{i + 1}</span>
                  )}
                </span>
                {i < steps.length - 1 ? (
                  <span
                    className={cn(
                      "h-px flex-1 min-[380px]:h-0.5 motion-safe:transition-colors motion-safe:duration-500",
                      state === "complete" ? "bg-primary/50" : "bg-border/80",
                    )}
                    aria-hidden
                  />
                ) : (
                  <span className="w-1.5 shrink-0 sm:w-2.5" aria-hidden />
                )}
              </div>
              <span
                className={cn(
                  "max-w-[5.5rem] text-balance text-center text-[8.5px] font-medium leading-tight tracking-tight min-[400px]:text-[9px] sm:max-w-[6.5rem] sm:text-[10px]",
                  state === "current"
                    ? "font-semibold text-foreground"
                    : state === "complete"
                      ? "text-foreground/85"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
