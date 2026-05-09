"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

import { bpOverline } from "@/components/booking-prototype/visual-system";

import { customerSectionClass } from "../customer-dashboard-ui";

type Tone = "neutral" | "primary";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface EmptyStateCardProps {
  /** Lucide icon (or any SVG-shaped component). */
  icon: IconType;
  /** Small label above the title (e.g. "Today", "Schedule", "Dispatch"). */
  overline?: string;
  /** Headline — 1 calm sentence. */
  title: string;
  /** Optional body text — keeps tone reassuring, not apologetic. */
  body?: string;
  /** Optional CTA element (button, link). Rendered below the body. */
  action?: ReactNode;
  /** Visual emphasis. Default `neutral` (muted ring), `primary` for guidance moments. */
  tone?: Tone;
  /** Override the surrounding card padding (rare). */
  className?: string;
  /**
   * Force the icon ring tone independent of the card tone — used when the
   * empty state is purely informational but you still want a primary-coloured
   * icon (e.g. "All caught up" with a sparkle).
   */
  iconTone?: Tone;
}

/**
 * Single empty-state shell used by every dashboard. Replaces the per-role
 * empty card variants (`CleanerEmptyNoVisitsToday`, `customer-views/dashboard-overview-empty`,
 * inline admin "no data" blocks) so spacing, typography, ring tones, and
 * motion-safe transitions stay identical across the platform.
 *
 *   <EmptyStateCard
 *     icon={CalendarOff}
 *     overline="Today"
 *     title="No visits scheduled today."
 *     body="Rest, review your week, or update availability."
 *   />
 */
export function EmptyStateCard({
  icon: Icon,
  overline,
  title,
  body,
  action,
  tone = "neutral",
  iconTone,
  className,
}: EmptyStateCardProps) {
  const ringTone = iconTone ?? tone;
  return (
    <div
      className={cn(
        customerSectionClass({ priority: "quiet" }),
        "flex flex-col items-center px-5 py-10 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl ring-1",
          ringTone === "primary"
            ? "bg-primary/[0.08] ring-primary/15"
            : "bg-muted/50 ring-border/70",
        )}
      >
        <Icon
          className={cn(
            "size-6",
            ringTone === "primary" ? "text-primary/90" : "text-muted-foreground",
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      </span>
      {overline ? <p className={cn(bpOverline, "mt-5")}>{overline}</p> : null}
      <h2 className="booking-display mt-2 text-lg font-normal text-foreground">{title}</h2>
      {body ? (
        <p className="mt-1 max-w-xs text-[13px] leading-snug text-muted-foreground">{body}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
