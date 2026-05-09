"use client";

import type { ReactNode } from "react";

import { bp, bpHint, bpLegend } from "@/components/booking-prototype/visual-system";
import { cn } from "@/lib/utils";

/**
 * Production schedule fieldset with prototype-aligned presentation.
 * RHF registers live in `children`; this shell is presentation-only.
 */
export function CustomerScheduleSection({
  title,
  description,
  summaryLine,
  summaryPlaceholder,
  children,
}: {
  title: string;
  description?: string;
  /** Human-readable range from {@link buildCustomerScheduleSummaryLine}. */
  summaryLine: string;
  /** When true, summary uses quieter emphasis (incomplete selection). */
  summaryPlaceholder: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className={cn(bp.section, "space-y-5")}>
      <legend className={cn(bpLegend, "px-1")}>{title}</legend>
      {description ? <p className={cn(bpHint, "px-1 -mt-1")}>{description}</p> : null}

      <div
        className={cn(bp.wellQuiet, "px-4 py-3.5")}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Arrival window
        </p>
        <p
          className={cn(
            "mt-1 text-[15px] font-medium leading-snug tracking-tight md:text-[14px]",
            summaryPlaceholder ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {summaryLine}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
