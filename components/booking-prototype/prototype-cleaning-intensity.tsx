"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { CLEANING_INTENSITY_PRESETS, type CleaningIntensityPresetId } from "./cleaning-intensity-presets";
import { bpHint, bpLegend } from "./visual-system";

/**
 * Compact segmented pills + lightweight tooltips:
 * — Desktop: hover shows floating hint (`group-hover`).
 * — Touch: tap toggles hint bubble (`data-tip-open` on control); outside tap closes.
 */
export function PrototypeCleaningIntensityRow({
  value,
  onChange,
}: {
  value: CleaningIntensityPresetId | "";
  onChange: (id: CleaningIntensityPresetId) => void;
}) {
  const rootId = useId();
  const [openTipId, setOpenTipId] = useState<CleaningIntensityPresetId | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeTip = useCallback(() => setOpenTipId(null), []);

  useEffect(() => {
    if (!openTipId) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el?.contains(e.target as Node)) closeTip();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [openTipId, closeTip]);

  return (
    <fieldset className="space-y-2">
      <legend id={`${rootId}-legend`} className={bpLegend}>
        Cleaning intensity
      </legend>
      <p className={cn(bpHint, "text-[12px] leading-snug")}>One choice sets both home condition and visit depth for your estimate.</p>

      <div ref={containerRef} className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={`${rootId}-legend`}>
        {CLEANING_INTENSITY_PRESETS.map((p) => {
          const selected = value === p.id;
          const tipOpen = openTipId === p.id;
          return (
            <span key={p.id} className="group/tooltip relative inline-flex">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                data-tip-open={tipOpen ? "" : undefined}
                aria-describedby={`${rootId}-tip-${p.id}`}
                onClick={() => {
                  onChange(p.id);
                  setOpenTipId((cur) => (cur === p.id ? null : p.id));
                }}
                className={cn(
                  "relative min-h-10 touch-manipulation rounded-full px-3.5 py-2 text-left text-[13px] font-medium leading-snug tracking-tight transition-[background-color,box-shadow,color,transform] duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "motion-safe:active:scale-[0.98]",
                  selected
                    ? "bg-primary text-primary-foreground shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-primary/20"
                    : "bg-card/85 text-foreground ring-1 ring-border/75 hover:bg-muted/25 dark:bg-card/50",
                )}
              >
                {p.label}
              </button>

              {/* Hover tooltip (fine pointer devices) */}
              <span
                id={`${rootId}-tip-${p.id}`}
                role="tooltip"
                className={cn(
                  "pointer-events-none invisible absolute bottom-[calc(100%+6px)] left-1/2 z-20 w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 scale-95 rounded-lg px-2.5 py-1.5 text-center text-[11px] leading-snug opacity-0 shadow-lg ring-1 transition-[opacity,transform,visibility] duration-150 ease-out",
                  "bg-popover text-popover-foreground ring-black/[0.06] dark:ring-white/[0.1]",
                  "max-md:hidden md:group-hover/tooltip:visible md:group-hover/tooltip:scale-100 md:group-hover/tooltip:opacity-100",
                )}
              >
                {p.tooltip}
              </span>

              {/* Tap tooltip (mobile / coarse pointer) */}
              {tipOpen ? (
                <span
                  className={cn(
                    "absolute bottom-[calc(100%+6px)] left-1/2 z-20 w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-center text-[11px] leading-snug shadow-lg ring-1 md:hidden",
                    "animate-in fade-in zoom-in-95 duration-150 bg-popover text-popover-foreground ring-black/[0.06] dark:ring-white/[0.1]",
                  )}
                >
                  {p.tooltip}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
    </fieldset>
  );
}
