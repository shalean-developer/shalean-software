"use client";

import { cn } from "@/lib/utils";

import { BOOKING_SERVICES } from "@/lib/booking/catalog";
import { formatServiceDurationLabel } from "@/lib/booking/format-duration";

import type { BookingPrototypeDraft } from "../types";
import { bp } from "../visual-system";

export function StepSelectService({
  draft,
  updateDraft,
}: {
  draft: BookingPrototypeDraft;
  updateDraft: (patch: Partial<BookingPrototypeDraft>) => void;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Choose a service</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {BOOKING_SERVICES.map((svc) => {
          const selected = draft.serviceType === svc.slug;
          const duration = formatServiceDurationLabel(svc.slug);
          return (
            <button
              key={svc.slug}
              type="button"
              aria-pressed={selected}
              onClick={() => updateDraft({ serviceType: svc.slug })}
              className={cn(
                "rounded-2xl px-5 py-5 text-left transition-[transform,box-shadow,background-color,border-color,ring-color] duration-200 ease-out touch-manipulation",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "motion-safe:active:scale-[0.993]",
                selected
                  ? "border border-primary/35 bg-primary/[0.08] shadow-[0_4px_24px_-12px_rgba(53,99,255,0.35)] ring-1 ring-primary/40 dark:bg-primary/[0.12] dark:shadow-[0_4px_24px_-12px_rgba(91,130,255,0.25)]"
                  : "border border-transparent bg-card shadow-[0_1px_3px_rgba(28,36,48,0.04)] ring-1 ring-border hover:bg-muted/40 hover:ring-primary/12 dark:bg-card",
              )}
            >
              <span className="flex flex-wrap items-center gap-2">
                {svc.badges.mostBooked ? (
                  <span className={cn(bp.badge, "border-primary/20 bg-primary/[0.08] text-primary")}>Most booked</span>
                ) : null}
                {svc.badges.seasonal ? (
                  <span className={cn(bp.badge, "text-foreground/80")}>Seasonal reset</span>
                ) : null}
                {svc.badges.premium ? (
                  <span className={cn(bp.badge, "border-primary/25 text-primary")}>Premium</span>
                ) : null}
              </span>

              <span className="mt-3 block text-[1.05rem] font-medium leading-snug tracking-tight text-foreground">
                {svc.title}
              </span>
              <span className="mt-1.5 block text-[13px] font-normal leading-relaxed text-muted-foreground">
                {svc.cardSubtitle}
              </span>
              <span className="mt-3 inline-flex items-center gap-2 text-[12px] font-normal tabular-nums text-muted-foreground">
                <span className="rounded-full bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Estimated duration
                </span>
                <span className="text-foreground/90">{duration}</span>
              </span>
              <span className="mt-3 block border-t border-border/60 pt-3 text-[12px] font-normal leading-snug text-muted-foreground">
                {svc.purposeLine}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
