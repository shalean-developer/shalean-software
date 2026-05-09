"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { bpOverline } from "@/components/booking-prototype/visual-system";

interface DashboardSectionHeaderProps {
  /** Tiny eyebrow above the title (e.g. "Dispatch", "Today", "Earnings"). */
  overline?: string;
  /** Main heading. Rendered as an h1 by default; `as` switches the level. */
  title: string;
  /** Optional supporting line beneath the title. */
  subtitle?: string;
  /** Right-side cluster — usually status chips or a `New visit` link. */
  trailing?: ReactNode;
  /** Override container className (margin, gap, etc.). */
  className?: string;
  /** Heading level. Defaults to `h1` for top-of-view headers. */
  as?: "h1" | "h2";
  /** Title size variant. `hero` for top-of-page, `compact` for inline subsections. */
  size?: "hero" | "compact";
}

/**
 * Shared "overline · title · subtitle [+ trailing chips]" row used at the top
 * of every dashboard view. Centralises the typography, hierarchy, and
 * `flex-wrap` spacing so role-specific views stay aligned.
 *
 *   <DashboardSectionHeader
 *     overline="Dispatch"
 *     title="Orchestration"
 *     subtitle="Assignments, conflicts, and matching across today's lanes."
 *     trailing={<span>{queueCount} pending</span>}
 *   />
 */
export function DashboardSectionHeader({
  overline,
  title,
  subtitle,
  trailing,
  className,
  as = "h1",
  size = "hero",
}: DashboardSectionHeaderProps) {
  const HeadingTag = as;
  const heading = (
    <HeadingTag
      className={cn(
        "booking-display font-normal tracking-tight text-foreground",
        size === "hero" ? "mt-1 text-[1.4rem] sm:text-[1.55rem]" : "mt-1 text-[1.05rem]",
      )}
    >
      {title}
    </HeadingTag>
  );

  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {overline ? <p className={bpOverline}>{overline}</p> : null}
        {heading}
        {subtitle ? (
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? <div className="flex flex-wrap gap-1.5">{trailing}</div> : null}
    </div>
  );
}
