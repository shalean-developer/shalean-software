"use client";

import { cn } from "@/lib/utils";

import type { TriState, YesNoUnsure } from "@/lib/booking/catalog";

const trackBase =
  "relative inline-flex h-[1.65rem] w-[2.75rem] shrink-0 cursor-pointer rounded-full border border-transparent transition-[background-color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

const knob =
  "pointer-events-none absolute top-1/2 size-[1.35rem] rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06] transition-[transform] duration-200 ease-out motion-reduce:transition-none dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)] dark:ring-white/[0.12]";

function knobPosition(on: boolean, mixed: boolean) {
  if (mixed) return "left-1/2 -translate-x-1/2 -translate-y-1/2";
  if (on) return "left-[3px] translate-x-[1.22rem] -translate-y-1/2";
  return "left-[3px] -translate-y-1/2";
}

/** Boolean switch — extras, checkout terms, etc. */
export function PrototypeSwitch({
  checked,
  onCheckedChange,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label": string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        trackBase,
        checked
          ? "bg-[color:var(--booking-success)] shadow-inner shadow-[rgba(28,36,48,0.12)]"
          : "bg-muted/80 dark:bg-muted/55",
        disabled && "cursor-not-allowed opacity-[0.42]",
      )}
    >
      <span aria-hidden className={cn(knob, knobPosition(checked, false))} />
    </button>
  );
}

/** Yes / No / unset (`""`) — unset shows centered knob (mixed). */
export function PrototypeYesNoToggleRow({
  label,
  hint,
  labelId,
  value,
  onChange,
  estimateNote,
}: {
  label: string;
  hint?: string;
  labelId: string;
  value: TriState;
  onChange: (next: TriState) => void;
  /** Optional live-pricing microcopy (does not change switch chrome). */
  estimateNote?: string | null;
}) {
  const on = value === "yes";
  const off = value === "no";
  const mixed = value === "";

  const handleSwitch = () => {
    if (value === "yes") onChange("no");
    else onChange("yes");
  };

  return (
    <div className="flex min-h-[3rem] flex-wrap items-center justify-between gap-x-4 gap-y-2 py-1">
      <div className="min-w-0 flex-1">
        <p id={labelId} className="text-[14px] font-medium leading-snug text-foreground">
          {label}
        </p>
        {hint ? <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{hint}</p> : null}
        {estimateNote ? (
          <p
            id={`${labelId}-estimate`}
            className="mt-1 text-[11px] font-medium tabular-nums text-primary/85 motion-safe:transition-opacity motion-safe:duration-200"
          >
            {estimateNote}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide tabular-nums",
            off ? "text-foreground" : "text-muted-foreground",
          )}
        >
          No
        </span>
        <button
          type="button"
          role="switch"
          aria-labelledby={labelId}
          aria-describedby={estimateNote ? `${labelId}-estimate` : undefined}
          aria-checked={mixed ? "mixed" : on}
          onClick={handleSwitch}
          className={cn(
            trackBase,
            on && "bg-[color:var(--booking-success)] shadow-inner shadow-[rgba(28,36,48,0.12)]",
            off && !mixed && "bg-muted/80 dark:bg-muted/55",
            mixed && "bg-muted/55 ring-1 ring-dashed ring-muted-foreground/35 dark:bg-muted/40",
          )}
        >
          <span aria-hidden className={cn(knob, knobPosition(on, mixed))} />
        </button>
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide tabular-nums",
            on ? "text-[color:var(--booking-success)]" : "text-muted-foreground",
          )}
        >
          Yes
        </span>
      </div>
    </div>
  );
}

/** Yes / No / Not sure — switch toggles yes↔no; “Not sure” sets `unsure`. */
export function PrototypeYesNoUnsureToggleRow({
  label,
  hint,
  labelId,
  value,
  onChange,
  estimateNote,
}: {
  label: string;
  hint?: string;
  labelId: string;
  value: YesNoUnsure;
  onChange: (next: YesNoUnsure) => void;
  estimateNote?: string | null;
}) {
  const on = value === "yes";
  const off = value === "no";
  const unsure = value === "unsure";
  const mixed = value === "";

  const handleSwitch = () => {
    if (value === "yes") onChange("no");
    else onChange("yes");
  };

  return (
    <div className="flex min-h-[3rem] flex-col gap-2 py-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4">
      <div className="min-w-0 flex-1">
        <p id={labelId} className="text-[14px] font-medium leading-snug text-foreground">
          {label}
        </p>
        {hint ? <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{hint}</p> : null}
        {estimateNote ? (
          <p
            id={`${labelId}-estimate`}
            className="mt-1 text-[11px] font-medium tabular-nums text-primary/85 motion-safe:transition-opacity motion-safe:duration-200"
          >
            {estimateNote}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-end sm:gap-2.5">
        <button
          type="button"
          onClick={() => onChange("unsure")}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors touch-manipulation",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            unsure
              ? "bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/35 dark:text-amber-200 dark:ring-amber-400/40"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          Not sure
        </button>
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide tabular-nums",
            off && !unsure && !mixed ? "text-foreground" : "text-muted-foreground",
          )}
        >
          No
        </span>
        <button
          type="button"
          role="switch"
          aria-labelledby={labelId}
          aria-describedby={estimateNote ? `${labelId}-estimate` : undefined}
          aria-checked={unsure || mixed ? "mixed" : on}
          onClick={handleSwitch}
          className={cn(
            trackBase,
            on &&
              !unsure &&
              !mixed &&
              "bg-[color:var(--booking-success)] shadow-inner shadow-[rgba(28,36,48,0.12)]",
            off && !unsure && !mixed && "bg-muted/80 dark:bg-muted/55",
            (unsure || mixed) && "bg-muted/50 ring-1 ring-dashed ring-muted-foreground/35 dark:bg-muted/35",
          )}
        >
          <span aria-hidden className={cn(knob, knobPosition(on && !unsure, unsure || mixed))} />
        </button>
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide tabular-nums",
            on && !unsure ? "text-[color:var(--booking-success)]" : "text-muted-foreground",
          )}
        >
          Yes
        </span>
      </div>
    </div>
  );
}
