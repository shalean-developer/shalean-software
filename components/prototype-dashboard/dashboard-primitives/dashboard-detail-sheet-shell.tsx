"use client";

import { useEffect, type ComponentType, type ReactNode, type SVGProps } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Z_INDEX, touchTargetClass } from "./mobile-shell";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface DashboardDetailSheetShellProps {
  /** Mount only when open. Parent controls visibility. */
  open: boolean;
  /** Close handler — called by scrim, ESC key, and the X button. */
  onClose: () => void;
  /** Pill icon (Visit, Cleaner, Receipt, Cancel, etc.). */
  icon: IconType;
  /** Pill label that names the action surface. */
  label: string;
  /** Sheet body — role-specific content. */
  children: ReactNode;
  /** Optional aria-label override (defaults to "Detail panel"). */
  ariaLabel?: string;
  /**
   * Width override for the sheet panel on `sm:` viewports and up. Default
   * `sm:max-w-md` matches customer / cleaner sheets. Admin's heavier sheets
   * may pass `sm:max-w-2xl`.
   */
  desktopMaxWidthClass?: string;
}

/**
 * Bottom-sheet on mobile, centered modal on `sm:` and up. Replaces the
 * duplicate `fixed inset-0 z-[70]` + scrim + ESC handler pattern that lives
 * inside every per-role detail sheet so the chrome (animation, focus trap,
 * body scroll lock, close affordances, z-index) stays unified.
 *
 * Role-specific bodies pass through `children` untouched — this primitive
 * never imports a role context, never knows what the user is doing inside the
 * sheet. That keeps the migration low-risk.
 */
export function DashboardDetailSheetShell({
  open,
  onClose,
  icon: Icon,
  label,
  children,
  ariaLabel = "Detail panel",
  desktopMaxWidthClass = "sm:max-w-md",
}: DashboardDetailSheetShellProps) {
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
    <div
      className="fixed inset-0 flex items-end sm:items-center sm:justify-center"
      style={{ zIndex: Z_INDEX.detailScrim }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        aria-label="Close detail"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-foreground/35 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none"
      />
      <div
        className={cn(
          "relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-background/98 p-5 shadow-[0_-18px_60px_-30px_rgba(15,23,48,0.45)] backdrop-blur-xl sm:rounded-3xl sm:p-6",
          desktopMaxWidthClass,
          "motion-safe:animate-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-300 motion-safe:ease-out motion-reduce:animate-none",
        )}
        style={{ zIndex: Z_INDEX.detail }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/20">
            <Icon className="size-3" strokeWidth={1.85} aria-hidden />
            {label}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-muted/45 hover:text-foreground active:scale-[0.97]",
              touchTargetClass,
            )}
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </div>
    </div>
  );
}
