"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Compact horizontal stepper for quantity-enabled add-ons.
 * Designed to feel premium, app-like, and thumb-friendly on mobile.
 */
export function PrototypeQuantityStepper({
  value,
  min = 1,
  max = 10,
  unitLabel,
  unitLabelSingular,
  onDecrement,
  onIncrement,
  ariaLabel,
  size = "md",
}: {
  value: number;
  min?: number;
  max?: number;
  unitLabel: string;
  unitLabelSingular?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  const canDec = value > min;
  const canInc = value < max;
  const unit = value === 1 ? (unitLabelSingular ?? unitLabel) : unitLabel;

  const buttonBase =
    "inline-flex items-center justify-center rounded-full border border-border/70 bg-card text-foreground/85 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[transform,background-color,border-color,opacity,box-shadow] duration-150 ease-out touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.93] hover:border-primary/40 hover:bg-muted/45";

  const buttonSize = size === "sm" ? "size-8" : "size-9";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  const valueSize = size === "sm" ? "min-w-[2rem] text-[13px]" : "min-w-[2.25rem] text-[14px]";

  return (
    <div
      className="inline-flex items-center gap-2"
      role="group"
      aria-label={ariaLabel}
    >
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={onDecrement}
          disabled={!canDec}
          aria-label={`Decrease ${unit}`}
          className={cn(buttonBase, buttonSize, !canDec && "cursor-not-allowed opacity-40 hover:border-border/70 hover:bg-card")}
        >
          <Minus className={cn(iconSize, "stroke-[1.7]")} aria-hidden />
        </button>
        <span
          aria-live="polite"
          className={cn(
            "inline-flex shrink-0 items-center justify-center text-center font-semibold tabular-nums text-foreground",
            valueSize,
          )}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={!canInc}
          aria-label={`Increase ${unit}`}
          className={cn(buttonBase, buttonSize, !canInc && "cursor-not-allowed opacity-40 hover:border-border/70 hover:bg-card")}
        >
          <Plus className={cn(iconSize, "stroke-[1.7]")} aria-hidden />
        </button>
      </div>
      <span className="hidden text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
        {unit}
      </span>
    </div>
  );
}
