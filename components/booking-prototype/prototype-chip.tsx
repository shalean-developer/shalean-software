"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { bpHint, bpHorizontalOptionPill, bpLegend, bpOptionTile, bpSegment } from "./visual-system";

const quantityBtn =
  "flex size-11 shrink-0 items-center justify-center rounded-xl text-foreground transition-[background-color,color,transform] duration-200 ease-out touch-manipulation " +
  "hover:bg-muted/35 active:scale-[0.96] motion-reduce:active:scale-100 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:pointer-events-none disabled:opacity-[0.35]";

export function PrototypeChipGroup<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
  columnsClassName = "sm:grid-cols-2",
  compact = false,
  tileClassName,
}: {
  label: string;
  hint?: string;
  value: T | "";
  onChange: (next: T) => void;
  options: { id: T; title: string; description?: string }[];
  columnsClassName?: string;
  /** Tighter spacing and tiles — booking prototype residential density. */
  compact?: boolean;
  /** Merged into each option tile (e.g. min-height for uniform cards). */
  tileClassName?: string;
}) {
  return (
    <fieldset className={cn(compact ? "space-y-2" : "space-y-3")}>
      <legend className={cn(bpLegend, compact && "text-[15px] leading-tight")}>{label}</legend>
      {hint ? <p className={cn(bpHint, compact && "text-[12px] leading-snug")}>{hint}</p> : null}
      <div className={cn(compact ? "gap-2" : "gap-3", "grid", columnsClassName)}>
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={selected}
              className={cn(
                bpOptionTile(selected),
                compact && "px-3 py-3 [&_span:first-child]:text-[13px]",
                compact && opt.description && "[&_.desc]:mt-1 [&_.desc]:text-[12px]",
                tileClassName,
              )}
            >
              <span className="block text-[14px] font-medium leading-snug">{opt.title}</span>
              {opt.description ? (
                <span className={cn("desc mt-1.5 block text-[13px] leading-relaxed text-muted-foreground")}>
                  {opt.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Single-row (md+) compact pills — labels only. Same `onChange` contract as `PrototypeChipGroup`.
 */
export function PrototypeHorizontalChipRow<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
  compact = false,
}: {
  label: string;
  hint?: string;
  value: T | "";
  onChange: (next: T) => void;
  options: { id: T; title: string }[];
  compact?: boolean;
}) {
  return (
    <fieldset className={cn(compact ? "space-y-2" : "space-y-3")}>
      <legend className={cn(bpLegend, compact && "text-[15px] leading-tight")}>{label}</legend>
      {hint ? <p className={cn(bpHint, compact && "text-[12px] leading-snug")}>{hint}</p> : null}
      <div
        className={cn(
          "flex flex-wrap gap-2 sm:gap-2.5 md:flex-nowrap",
          "[&>button]:basis-[calc(50%-0.25rem)] [&>button]:grow md:[&>button]:basis-0 md:[&>button]:flex-1",
        )}
      >
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={selected}
              className={bpHorizontalOptionPill(selected)}
            >
              {opt.title}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Compact +/- quantity control for booking prototype — saves vertical space vs segmented pills.
 */
export function PrototypeQuantityStepper({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  formatDisplay,
}: {
  label: string;
  hint?: string;
  value: number | "";
  onChange: (next: number) => void;
  min: number;
  max: number;
  formatDisplay?: (n: number) => string;
}) {
  const n = value === "" ? null : value;
  const canDec = n !== null && n > min;
  const canInc = n === null ? true : n < max;

  const display =
    n === null ? "–" : formatDisplay ? formatDisplay(n) : String(n);

  const dec = () => {
    if (n === null || n <= min) return;
    onChange(n - 1);
  };

  const inc = () => {
    if (n === null) {
      onChange(min);
      return;
    }
    if (n < max) onChange(n + 1);
  };

  return (
    <fieldset className="flex min-h-[5.25rem] min-w-0 flex-1 flex-col gap-1.5">
      <legend className={cn(bpLegend, "text-[15px] leading-tight")}>{label}</legend>
      {hint ? <p className={cn(bpHint, "text-[12px] leading-snug")}>{hint}</p> : null}
      <div
        className={cn(
          "mt-auto flex h-12 items-stretch overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/75 dark:bg-card/50",
          "shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:shadow-none",
        )}
        role="group"
        aria-label={label}
      >
        <button
          type="button"
          className={quantityBtn}
          aria-label={`Decrease ${label}`}
          disabled={!canDec}
          onClick={dec}
        >
          <Minus className="size-[18px] opacity-90" aria-hidden strokeWidth={2.25} />
        </button>
        <div
          className="flex min-w-0 flex-1 items-center justify-center tabular-nums text-[17px] font-medium tracking-tight text-foreground"
          aria-live="polite"
        >
          {display}
        </div>
        <button
          type="button"
          className={quantityBtn}
          aria-label={`Increase ${label}`}
          disabled={!canInc}
          onClick={inc}
        >
          <Plus className="size-[18px] opacity-90" aria-hidden strokeWidth={2.25} />
        </button>
      </div>
    </fieldset>
  );
}

export function PrototypeSegmentedNumbers({
  label,
  hint,
  value,
  onChange,
  options,
  formatLabel,
}: {
  label: string;
  hint?: string;
  value: number | "";
  onChange: (next: number) => void;
  options: number[];
  /** Optional display label (e.g. `5+` for overflow bucket). */
  formatLabel?: (n: number) => string;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className={bpLegend}>{label}</legend>
      {hint ? <p className={bpHint}>{hint}</p> : null}
      <div className="flex flex-wrap gap-3">
        {options.map((n) => {
          const selected = value === n;
          const shown = formatLabel ? formatLabel(n) : String(n);
          return (
            <button
              key={n}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(n)}
              className={bpSegment(selected)}
            >
              {shown}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
