"use client";

import { MoreHorizontal, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Z_INDEX, touchTargetClass } from "./mobile-shell";

export interface DashboardTabItem<TabId extends string> {
  tab: TabId;
  label: string;
  icon: LucideIcon;
  /**
   * Optional unread badge count rendered on the tab. Only shown when > 0.
   * Customer dashboard uses this on the Messages tab.
   */
  badgeCount?: number;
}

interface DashboardMobileTabBarProps<TabId extends string> {
  /** Primary tabs — typically 3-4 items so the More button stays balanced. */
  items: DashboardTabItem<TabId>[];
  /** Currently active tab. */
  activeTab: TabId;
  /** Tab selection handler. */
  onSelect: (tab: TabId) => void;
  /** Open the More drawer (mobile-only secondary nav). */
  onMoreOpen: () => void;
  /** Whether the More drawer is currently open (drives active styling). */
  moreOpen: boolean;
  /** When true, renders the More button in active styling regardless of `moreOpen`. */
  moreActive?: boolean;
  /** Optional unread badge on the More button (admin uses this for messages). */
  moreBadgeCount?: number;
  /** Stable id prefix used for tab ARIA wiring. */
  idPrefix: string;
  /** Aria-controls target id (the tab panel). */
  ariaControls: string;
  /** Aria-label for the nav element. */
  ariaLabel?: string;
}

/**
 * Mobile bottom tab bar — shared across customer, cleaner, and admin
 * dashboards. Each role mounts its own array of `items`; the chrome
 * (rounded-xl pill, motion-safe scale, badge dot, More button) lives here
 * so spacing, touch targets, and active states stay aligned.
 *
 * Wrap in your own `<nav className="fixed inset-x-0 bottom-0 …">` when
 * mounting — this primitive only renders the inner row so role shells can
 * keep their existing safe-area padding.
 */
export function DashboardMobileTabBar<TabId extends string>({
  items,
  activeTab,
  onSelect,
  onMoreOpen,
  moreOpen,
  moreActive = false,
  moreBadgeCount = 0,
  idPrefix,
  ariaControls,
  ariaLabel = "Primary",
}: DashboardMobileTabBarProps<TabId>) {
  const moreOn = moreActive || moreOpen;
  return (
    <nav className="flex w-full items-stretch px-1" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = activeTab === item.tab && !moreOpen;
        const badge = item.badgeCount && item.badgeCount > 0 ? item.badgeCount : 0;
        return (
          <button
            key={`${idPrefix}-${item.tab}`}
            type="button"
            role="tab"
            id={`${idPrefix}-${item.tab}`}
            aria-selected={selected}
            aria-controls={ariaControls}
            onClick={() => onSelect(item.tab)}
            aria-label={`${item.label} tab`}
            className={cn(
              "group relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-medium",
              "motion-safe:transition-[color,transform] motion-safe:duration-200 motion-safe:ease-out",
              touchTargetClass,
              selected
                ? "text-primary motion-safe:scale-[1.02] motion-reduce:scale-100"
                : "text-muted-foreground active:scale-[0.97]",
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-2xl motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
                selected &&
                  "bg-primary/[0.12] shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
              )}
            >
              <Icon
                className={cn("size-[1.15rem] shrink-0 stroke-[1.7]", selected && "text-primary")}
                aria-hidden
              />
            </span>
            {badge > 0 ? (
              <span className="absolute right-3 top-1.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
            <span className="text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]">
              {item.label}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        id={`${idPrefix}-more`}
        onClick={onMoreOpen}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        aria-label="More navigation"
        className={cn(
          "group relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-medium",
          "motion-safe:transition-[color,transform] motion-safe:duration-200 motion-safe:ease-out",
          touchTargetClass,
          moreOn
            ? "text-primary motion-safe:scale-[1.02] motion-reduce:scale-100"
            : "text-muted-foreground active:scale-[0.97]",
        )}
      >
        <span
          className={cn(
            "relative flex size-9 items-center justify-center rounded-2xl motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
            moreOn && "bg-primary/[0.12] shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
          )}
        >
          <MoreHorizontal
            className={cn("size-[1.15rem] shrink-0 stroke-[1.7]", moreOn && "text-primary")}
            aria-hidden
          />
          {moreBadgeCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[8.5px] font-bold leading-none text-white shadow-[0_0_0_2px_var(--background)]">
              {moreBadgeCount > 9 ? "9+" : moreBadgeCount}
            </span>
          ) : null}
        </span>
        <span className="text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]">
          More
        </span>
      </button>
    </nav>
  );
}

/**
 * Z-index tokens for the bar's mounting wrapper. Re-exported here for
 * convenience so dashboard shells don't need to import `mobile-shell` twice.
 */
export const MOBILE_TAB_BAR_Z = Z_INDEX.tabBar;
