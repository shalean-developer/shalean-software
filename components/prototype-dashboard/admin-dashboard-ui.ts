import { cn } from "@/lib/utils";

export type AdminNavTab =
  | "overview"
  | "bookings"
  | "dispatch"
  | "cleaners"
  | "customers"
  | "earnings"
  | "insights"
  | "messages"
  | "settings";

export function adminSectionClass({
  className,
  priority = "default",
}: {
  className?: string;
  priority?: "hero" | "emphasis" | "default" | "quiet";
}) {
  return cn(
    "rounded-2xl ring-1 motion-safe:transition-[box-shadow,transform,border-color] motion-safe:duration-300",
    priority === "hero" &&
      "bg-gradient-to-br from-primary/[0.09] via-card to-card p-5 shadow-[0_4px_32px_-18px_rgba(53,99,255,0.22)] ring-primary/15 sm:p-6 md:p-7 motion-safe:hover:shadow-[0_8px_40px_-20px_rgba(53,99,255,0.28)]",
    priority === "emphasis" &&
      "bg-card p-4 shadow-[0_2px_16px_-12px_rgba(53,99,255,0.12)] ring-border sm:p-5 motion-safe:hover:-translate-y-px motion-safe:hover:shadow-[0_8px_28px_-16px_rgba(53,99,255,0.14)]",
    priority === "default" && "bg-card/90 p-4 shadow-[0_1px_4px_rgba(28,36,48,0.04)] ring-border/90 sm:p-5",
    priority === "quiet" && "bg-muted/[0.35] p-4 ring-border/70 sm:p-4",
    className,
  );
}

export type AdminChipVariant =
  | "info"
  | "active"
  | "success"
  | "warn"
  | "alert"
  | "muted";

const CHIP_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";

const CHIP_VARIANTS: Record<AdminChipVariant, string> = {
  info: "border-primary/25 bg-primary/[0.08] text-primary",
  active: "border-primary/30 bg-primary/[0.1] text-primary",
  success:
    "border-[color:var(--booking-success)]/35 bg-[color:var(--booking-success)]/10 text-[color:var(--booking-success)]",
  warn: "border-amber-400/40 bg-amber-400/[0.12] text-amber-700 dark:text-amber-300",
  alert: "border-rose-500/35 bg-rose-500/[0.1] text-rose-600 dark:text-rose-300",
  muted: "border-border/80 bg-muted/40 text-muted-foreground",
};

export function adminChipClass(variant: AdminChipVariant, className?: string) {
  return cn(CHIP_BASE, CHIP_VARIANTS[variant], className);
}
