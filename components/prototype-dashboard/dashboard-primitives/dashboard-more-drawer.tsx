"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import { bp } from "@/components/booking-prototype/visual-system";

import { MOBILE_FOOTER_OFFSET_CSS, Z_INDEX, touchTargetClass } from "./mobile-shell";

interface DashboardMoreDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Subtitle below the wordmark. Default "More options". */
  subtitle?: string;
  /**
   * Drawer body — role-specific nav lists, profile cards, shortcuts.
   * Wrapped in a scrollable container so footers stay pinned.
   */
  children: ReactNode;
  /** Sticky footer (sign out / hub link / new visit CTA). Optional. */
  footer?: ReactNode;
  /** Aria-label for screen readers. Default "More navigation". */
  ariaLabel?: string;
}

/**
 * Right-side slide-in drawer used by all three dashboards as their mobile
 * "More" surface. Owns:
 *
 *   - safe-area math (sits above the bottom tab bar via MOBILE_FOOTER_OFFSET_CSS)
 *   - scrim + ESC + body scroll lock
 *   - drawer chrome (border, shadow, blur, slide-in motion)
 *   - z-index ladder so it always lands above content but below toasts
 *
 * Each role keeps its own body content untouched — drawer body is whatever
 * `children` you pass.
 */
export function DashboardMoreDrawer({
  open,
  onClose,
  subtitle = "More options",
  children,
  footer,
  ariaLabel = "More navigation",
}: DashboardMoreDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        style={{ bottom: MOBILE_FOOTER_OFFSET_CSS, zIndex: Z_INDEX.drawerScrim }}
        className="fixed inset-x-0 top-0 cursor-default bg-foreground/30 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none"
      />
      <aside
        style={{ bottom: MOBILE_FOOTER_OFFSET_CSS, zIndex: Z_INDEX.drawer }}
        className={cn(
          "fixed right-0 top-0 flex w-[min(86vw,22rem)] flex-col overflow-hidden rounded-l-3xl border-l border-border/60 bg-background/98 shadow-[-14px_0_44px_-18px_rgba(15,23,48,0.32)] backdrop-blur-xl",
          "motion-safe:animate-in motion-safe:slide-in-from-right-8 motion-safe:duration-300 motion-safe:ease-out motion-reduce:animate-none",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-2">
          <div className="min-w-0">
            <p className={cn(bp.navWordmark, "tracking-tight")}>Shalean</p>
            <p className="text-[11.5px] font-medium text-muted-foreground">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close more"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-muted/45 hover:text-foreground active:scale-[0.97]",
              touchTargetClass,
            )}
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>

        {footer ? (
          <div className="border-t border-border/55 px-4 pb-3 pt-2.5">{footer}</div>
        ) : null}
      </aside>
    </div>
  );
}
