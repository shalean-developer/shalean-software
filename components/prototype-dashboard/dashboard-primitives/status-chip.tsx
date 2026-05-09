"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Unified status-chip vocabulary. Folds the customer/cleaner
 * `DashboardStatusChip` ("booking" / "cleaner" / "neutral") and the admin
 * `adminChipClass` ("info" / "active" / "success" / "warn" / "alert" /
 * "muted") into one set so a chip rendered in any dashboard reads the same.
 *
 * Existing per-role chip helpers continue to exist for back-compat — they
 * delegate to this primitive in a follow-up sweep.
 */
export type StatusChipTone =
  | "neutral"
  | "info"
  | "active"
  | "success"
  | "warn"
  | "alert"
  | "primary";

interface StatusChipProps {
  tone?: StatusChipTone;
  children: ReactNode;
  className?: string;
  /** Choose the visual density. `pill` is the default rounded-full. */
  shape?: "pill" | "tag";
}

const BASE =
  "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";

const TONE: Record<StatusChipTone, string> = {
  neutral: "border-border/80 bg-muted/40 text-muted-foreground",
  info: "border-primary/25 bg-primary/[0.08] text-primary",
  active: "border-primary/30 bg-primary/[0.1] text-primary",
  success:
    "border-[color:var(--booking-success)]/35 bg-[color:var(--booking-success)]/10 text-[color:var(--booking-success)]",
  warn: "border-amber-400/40 bg-amber-400/[0.12] text-amber-700 dark:text-amber-300",
  alert: "border-rose-500/35 bg-rose-500/[0.1] text-rose-600 dark:text-rose-300",
  primary: "border-primary/25 bg-primary/[0.08] text-primary",
};

export function StatusChip({
  tone = "neutral",
  children,
  className,
  shape = "pill",
}: StatusChipProps) {
  return (
    <span
      className={cn(
        BASE,
        shape === "pill" ? "rounded-full" : "rounded-md",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
