import { cn } from "@/lib/utils";

/**
 * Booking prototype tokens — Shalean blue (#3563FF) forward; Playfair + Inter from page wrapper.
 */

export const bp = {
  pageRoot:
    "min-h-full overflow-x-clip bg-gradient-to-b from-muted/60 via-background to-[#fafaf8] text-foreground antialiased selection:bg-primary/18 dark:from-background dark:via-background dark:to-muted/25",

  header:
    "border-b border-border/60 bg-background/85 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md supports-[backdrop-filter]:bg-background/75",

  /**
   * Unified booking nav — step label, progress row + avatar (sticky top).
   * Desktop rail uses `bp.railStickyTop` to sit below this shell.
   */
  unifiedNavShell:
    "sticky top-0 z-30 border-b border-border/80 bg-background/92 pt-[max(0.125rem,env(safe-area-inset-top,0px))] shadow-[0_1px_0_rgba(53,99,255,0.05)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 dark:shadow-[0_1px_0_rgba(91,130,255,0.1)]",

  /**
   * Sticky rail offset — unified nav height + ~12px breathing room (premium checkout sidebar).
   * Paired with stretched grid column so `position:sticky` has scroll range.
   */
  railStickyTop: "top-[5.15rem] md:top-[5.25rem]",

  /** Pill in header */
  badge:
    "rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground shadow-none",

  navWordmark: "text-base font-medium tracking-tight text-foreground",

  navMutedLink:
    "text-xs font-medium text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-primary hover:underline",

  progressMeta: "text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground",

  progressSegment:
    "h-[3px] min-w-0 flex-1 rounded-full transition-[background-color,opacity] duration-300 ease-out motion-reduce:transition-none",

  progressOn: "bg-primary",

  progressOff: "bg-primary/15 dark:bg-primary/20",

  heroTitle:
    "booking-display text-balance text-[1.5rem] font-normal leading-[1.22] tracking-[-0.01em] text-foreground sm:text-[1.72rem] sm:leading-[1.2] md:text-[1.9rem]",

  heroSubtitle:
    "max-w-xl text-pretty text-[14px] font-normal leading-relaxed text-muted-foreground sm:text-[15px] sm:leading-[1.55]",

  heroReassurance:
    "max-w-xl text-pretty text-[13px] font-normal leading-relaxed text-muted-foreground sm:text-[14px]",

  /** Primary section shell */
  section:
    "rounded-2xl bg-card p-5 shadow-[0_1px_4px_rgba(28,36,48,0.05)] ring-1 ring-border sm:p-7 dark:bg-card dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)]",

  sectionSoft: "rounded-2xl bg-muted/40 p-5 ring-1 ring-border/90 sm:p-6 dark:bg-muted/25",

  /** Nested wells (estimate, totals) */
  well: "rounded-xl bg-muted/30 px-4 py-5 ring-1 ring-border/60 dark:bg-muted/15",

  wellQuiet: "rounded-xl bg-muted/20 px-4 py-4 ring-1 ring-border/50 dark:bg-muted/12",

  /** Trust / support rows */
  trustRow: "flex gap-3 rounded-xl bg-muted/15 px-4 py-4 ring-1 ring-border/55 dark:bg-muted/10",

  microTrust:
    "flex flex-wrap gap-x-6 gap-y-2 rounded-xl px-4 py-3.5 text-[11px] leading-snug text-muted-foreground ring-1 ring-border/50",

  /** Sticky summary — desktop */
  stickyRail:
    "sticky rounded-2xl bg-card p-5 shadow-[0_4px_28px_-16px_rgba(53,99,255,0.09)] ring-1 ring-border backdrop-blur-md dark:bg-card dark:shadow-[0_4px_28px_-12px_rgba(0,0,0,0.45)]",

  /**
   * Compact mobile booking bar — full estimate & reassurance live in the bottom sheet
   * (`PrototypeStickySummary` + Base UI `Drawer`).
   */
  stickyMobileBar:
    "isolate fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-x-0 border-t border-border bg-background/96 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_36px_-18px_rgba(53,99,255,0.1)] backdrop-blur-xl [-webkit-tap-highlight-color:transparent] md:hidden",

  stickyEstimateWell: "rounded-xl bg-muted/25 px-4 py-4 ring-1 ring-border/55 dark:bg-muted/15",

  /** Form controls aligned to prototype */
  control:
    "h-12 w-full rounded-xl border-0 bg-card/90 px-3.5 text-base shadow-none ring-1 ring-border/80 transition-[box-shadow,background-color] duration-200 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/35 md:h-11 md:text-sm dark:bg-card/50",

  /**
   * Premium paired fields — neighbourhood + date on step 2 (custom chrome, native behaviour).
   */
  bookingFieldLabel:
    "text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",

  bookingFieldControl:
    "box-border h-[3.25rem] w-full rounded-2xl border border-border/80 bg-card px-4 text-[15px] font-normal text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.028)] transition-[border-color,box-shadow,background-color,color] duration-200 outline-none placeholder:text-muted-foreground hover:border-border hover:bg-card focus-visible:border-primary/35 focus-visible:bg-card focus-visible:ring-[2px] focus-visible:ring-ring/30 focus-visible:ring-offset-0 md:text-[14px] dark:shadow-[0_1px_2px_rgba(0,0,0,0.15)]",

  stepEnter: "animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out fill-mode-both motion-reduce:animate-none",
} as const;

export function bpOptionTile(selected: boolean) {
  return cn(
    "rounded-2xl px-4 py-4 text-left transition-[transform,box-shadow,background-color,ring-color,border-color] duration-200 ease-out touch-manipulation",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "motion-safe:active:scale-[0.992]",
    selected
      ? "border border-primary/35 bg-primary/[0.1] shadow-[0_2px_8px_-4px_rgba(53,99,255,0.35)] ring-1 ring-primary/40 dark:bg-primary/[0.14] dark:ring-primary/45"
      : "border border-transparent bg-card shadow-[0_1px_3px_rgba(28,36,48,0.04)] ring-1 ring-border hover:bg-muted/50 hover:ring-primary/15 dark:bg-card",
  );
}

export function bpSegment(selected: boolean) {
  return cn(
    "min-h-11 min-w-11 rounded-full px-3.5 text-sm font-medium tabular-nums transition-[transform,box-shadow,background-color] duration-200 ease-out touch-manipulation",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "motion-safe:active:scale-[0.97]",
    selected
      ? "bg-primary text-primary-foreground shadow-[0_2px_8px_-3px_rgba(53,99,255,0.45)] ring-1 ring-primary/30"
      : "bg-card ring-1 ring-border hover:bg-muted/45",
  );
}

/** Compact horizontal option pill — property type row; lighter than full tiles. */
export function bpHorizontalOptionPill(selected: boolean) {
  return cn(
    "inline-flex min-h-10 w-full items-center justify-center rounded-xl px-2.5 py-2 text-center text-[13px] font-medium leading-snug tracking-tight text-balance transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none touch-manipulation sm:px-3",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "motion-safe:active:scale-[0.988]",
    selected
      ? "border border-primary/35 bg-primary/[0.1] text-foreground shadow-[0_2px_8px_-4px_rgba(53,99,255,0.28)] dark:bg-primary/[0.12]"
      : "border border-border bg-card text-foreground hover:border-primary/20 hover:bg-muted/45",
  );
}

export const bpLegend = "text-[15px] font-medium tracking-tight text-foreground";

export const bpHint = "text-[13px] font-normal leading-relaxed text-muted-foreground";

export const bpSectionHeading = "text-[15px] font-medium tracking-tight text-foreground";

export const bpSectionLead = "text-[13px] font-normal leading-relaxed text-muted-foreground";

export const bpDlRow = "flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-6";

export const bpDt = "text-[13px] font-normal text-muted-foreground";

export const bpDd = "text-[14px] font-medium text-foreground sm:text-right";

export const bpOverline = "text-[10px] font-medium uppercase tracking-[0.11em] text-muted-foreground";
