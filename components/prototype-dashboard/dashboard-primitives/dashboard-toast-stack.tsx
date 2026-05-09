"use client";

import { AlertOctagon, AlertTriangle, CheckCircle2, Info, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { MOBILE_TOAST_BOTTOM_CSS, Z_INDEX, touchTargetClass } from "./mobile-shell";

/**
 * Cross-dashboard toast tone vocabulary. Includes the admin's "alert" tone
 * (used for cancellations / SLA breaches) so customer + cleaner can opt in
 * later if needed without forking this primitive.
 */
export type DashboardToastTone =
  | "primary"
  | "info"
  | "warning"
  | "success"
  | "alert";

export interface DashboardToast {
  id: string;
  tone: DashboardToastTone;
  title: string;
  body?: string;
}

interface DashboardToastStackProps {
  /** Toasts surfaced from the role's workflow context. */
  toasts: DashboardToast[];
  /** Dismiss handler wired to the role's `dismissToast` reducer action. */
  onDismiss: (id: string) => void;
  /**
   * Maximum number of toasts visible at once. Older ones are clipped from the
   * top of the stack. Default 3.
   */
  maxVisible?: number;
  /** Optional aria-label override for the live region. */
  label?: string;
}

const TONE_ICON: Record<DashboardToastTone, typeof Info> = {
  primary: Sparkles,
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  alert: AlertOctagon,
};

const TONE_RING: Record<DashboardToastTone, string> = {
  primary: "ring-primary/25 bg-primary/[0.06]",
  info: "ring-sky-500/30 bg-sky-500/10",
  warning: "ring-amber-500/30 bg-amber-500/10",
  success: "ring-emerald-500/30 bg-emerald-500/10",
  alert: "ring-rose-500/30 bg-rose-500/10",
};

const TONE_ICON_COLOR: Record<DashboardToastTone, string> = {
  primary: "text-primary",
  info: "text-sky-600",
  warning: "text-amber-600",
  success: "text-emerald-600",
  alert: "text-rose-600",
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: DashboardToast;
  onDismiss: () => void;
}) {
  const Icon = TONE_ICON[toast.tone];
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-background/95 px-3.5 py-3 shadow-[0_18px_48px_-22px_rgba(15,23,48,0.32)] ring-1 backdrop-blur-xl",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-reduce:animate-none",
        TONE_RING[toast.tone],
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-background/70 ring-1 ring-border/55",
          TONE_ICON_COLOR[toast.tone],
        )}
      >
        <Icon className="size-4" strokeWidth={1.85} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight text-foreground">{toast.title}</p>
        {toast.body ? (
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{toast.body}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/55 hover:text-foreground active:scale-[0.97]",
          // Hit target reaches 44px even though the visual stays compact.
          touchTargetClass,
        )}
      >
        <X className="size-3.5" strokeWidth={1.85} aria-hidden />
      </button>
    </div>
  );
}

/**
 * Single source of truth for every dashboard's toast surface. Replace the
 * legacy per-role `*ToastStack` components with this primitive so timing,
 * positioning, safe-area math, tone palette, and motion stay aligned.
 */
export function DashboardToastStack({
  toasts,
  onDismiss,
  maxVisible = 3,
  label = "Operational notifications",
}: DashboardToastStackProps) {
  if (toasts.length === 0) return null;
  const visible = toasts.slice(-maxVisible);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 flex flex-col items-center gap-2 px-3 sm:items-end sm:px-4"
      style={{ bottom: MOBILE_TOAST_BOTTOM_CSS, zIndex: Z_INDEX.toast }}
      aria-label={label}
    >
      {visible.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}
