"use client";

import { Fragment } from "react";

import { cn } from "@/lib/utils";

import {
  VISIT_LIFECYCLE_LABEL,
  VISIT_LIFECYCLE_ORDER,
  type VisitLifecycleId,
} from "./mock-cleaner-data";

export function CleanerVisitLifecycleTimeline({
  current,
  className,
}: {
  current: VisitLifecycleId;
  className?: string;
}) {
  const activeIndex = Math.max(0, VISIT_LIFECYCLE_ORDER.indexOf(current));

  return (
    <div className={cn("w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:overflow-visible [&::-webkit-scrollbar]:hidden", className)} aria-label="Visit progress">
      <div className="flex min-w-[min(100%,520px)] items-center md:min-w-0">
        {VISIT_LIFECYCLE_ORDER.map((step, i) => {
          const done = i < activeIndex;
          const here = i === activeIndex;
          return (
            <Fragment key={step}>
              {i > 0 ? (
                <div
                  className={cn(
                    "mx-0.5 h-px min-w-[6px] flex-1 rounded-full motion-safe:transition-colors motion-safe:duration-300",
                    i <= activeIndex ? "bg-primary/40" : "bg-border/80",
                    here && "proto-dash-timeline-active-line",
                  )}
                  aria-hidden
                />
              ) : null}
              <div className="flex w-[3.25rem] shrink-0 flex-col items-center gap-1.5 sm:w-auto sm:min-w-[4rem]">
                <span
                  className={cn(
                    "size-2.5 rounded-full ring-2 ring-background motion-safe:transition-all motion-safe:duration-300",
                    done && "bg-primary/55",
                    here && "proto-dash-timeline-current-dot bg-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]",
                    !done && !here && "bg-muted-foreground/28",
                  )}
                />
                <span
                  className={cn(
                    "text-center text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]",
                    here && "text-primary",
                    done && !here && "text-foreground/75",
                    !done && !here && "text-muted-foreground",
                  )}
                >
                  {VISIT_LIFECYCLE_LABEL[step]}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
