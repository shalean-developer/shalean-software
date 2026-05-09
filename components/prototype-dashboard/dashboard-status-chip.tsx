"use client";

import { BOOKING_LIFECYCLE_LABEL_SHORT } from "@/lib/booking/lifecycle";
import { cn } from "@/lib/utils";

import type { BookingStatusId } from "./mock-customer-data";

export function DashboardStatusChip({
  variant,
  children,
}: {
  variant: "booking" | "cleaner" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        variant === "booking" && "border-primary/25 bg-primary/[0.08] text-primary",
        variant === "cleaner" && "border-[color:var(--booking-success)]/35 bg-[color:var(--booking-success)]/10 text-[color:var(--booking-success)]",
        variant === "neutral" && "border-border/80 bg-muted/40 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function BookingStatusChip({ status }: { status: BookingStatusId }) {
  return (
    <DashboardStatusChip variant="booking">{BOOKING_LIFECYCLE_LABEL_SHORT[status]}</DashboardStatusChip>
  );
}

const CLEANER_LABEL = {
  matched: "Confirmed",
  pending: "Matching",
  on_the_way: "En route",
} as const;

export function CleanerStatusChip({ status }: { status: keyof typeof CLEANER_LABEL }) {
  return <DashboardStatusChip variant="cleaner">{CLEANER_LABEL[status]}</DashboardStatusChip>;
}

/** Lightweight operational hints — not contractual statuses. */
export function OperationalSignalChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border border-border/70 bg-muted/[0.35] px-2 py-0.5 text-[10px] font-medium leading-tight tracking-tight text-muted-foreground",
        "motion-safe:transition-[border-color,background-color,color] motion-safe:duration-200",
        "hover:border-primary/20 hover:bg-primary/[0.04] hover:text-foreground/90",
      )}
    >
      {children}
    </span>
  );
}

export function OperationalSignalsRow({ items, limit = 3 }: { items: string[]; limit?: number }) {
  const shown = items.slice(0, Math.max(0, limit));
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Operational notes">
      {shown.map((label) => (
        <OperationalSignalChip key={label}>{label}</OperationalSignalChip>
      ))}
    </div>
  );
}
