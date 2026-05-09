"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Drawer } from "@base-ui/react/drawer";

import { BOOKING_SERVICES } from "@/lib/booking/catalog";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { BookingSummaryDetailBody } from "./booking-summary-detail-body";
import { computeMockQuote, formatZar } from "./mock-pricing";
import type { BookingPrototypeDraft } from "./types";
import { bp } from "./visual-system";

const STEP_CTA: Record<number, { primary: string; reassurance: string }> = {
  1: {
    primary: "Continue",
    reassurance: "Where & when next.",
  },
  2: {
    primary: "Continue",
    reassurance: "Then a few space details.",
  },
  3: {
    primary: "Continue",
    reassurance: "Add-ons if you like.",
  },
  4: {
    primary: "Continue",
    reassurance: "Cleaner preference next.",
  },
  5: {
    primary: "Continue",
    reassurance: "Then your full review.",
  },
  6: {
    primary: "Continue",
    reassurance: "Secure checkout preview next.",
  },
  7: {
    primary: "Finish booking",
    reassurance: "Email confirmation when live.",
  },
};

const primaryCtaClass =
  "touch-manipulation gap-2 rounded-xl font-medium shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[transform,opacity,box-shadow] duration-200 ease-out motion-safe:active:scale-[0.99] motion-reduce:transition-none dark:shadow-none disabled:pointer-events-none disabled:opacity-[0.42] disabled:shadow-none disabled:saturate-[0.92]";

const backGhostClass =
  "rounded-xl touch-manipulation font-medium text-muted-foreground transition-[transform,colors,opacity] duration-150 ease-out hover:bg-muted/40 hover:text-foreground motion-safe:active:scale-[0.99] motion-reduce:transition-none";

/** `key={draft.step}` from parent resets drawer open state when the step changes. */
function PrototypeStickySummaryMobile({
  draft,
  canProceed,
  blockedHint,
  pending,
  onPrimary,
  onBack,
  showBack = false,
  cta,
}: {
  draft: BookingPrototypeDraft;
  canProceed: boolean;
  blockedHint: string | null;
  pending?: boolean;
  onPrimary: () => void;
  onBack?: () => void;
  showBack?: boolean;
  cta: { primary: string; reassurance: string };
}) {
  const service = BOOKING_SERVICES.find((s) => s.slug === draft.serviceType);
  const quote = computeMockQuote(draft);
  const serviceTitle = service?.title ?? "Your visit";
  const estimateLine = quote ? formatZar(quote.totalZar) : "Estimate shortly";
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <Drawer.Root open={sheetOpen} onOpenChange={setSheetOpen}>
      <div
        className={cn(
          "transition-shadow duration-300 ease-out motion-reduce:transition-none",
          bp.stickyMobileBar,
        )}
      >
        <div className="mx-auto w-full max-w-lg space-y-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full min-h-[44px] items-center gap-2.5 rounded-xl px-1 py-1 text-left outline-none transition-colors [-webkit-tap-highlight-color:transparent] hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:bg-muted/25"
          >
            <p className="min-w-0 flex-1 truncate text-[14px] font-medium leading-tight tracking-tight text-foreground">
              <span>{serviceTitle}</span>
              <span className="font-normal text-muted-foreground"> · </span>
              <span className="tabular-nums text-[13px] font-normal text-muted-foreground">{estimateLine}</span>
            </p>
            <span className="shrink-0 text-[12px] font-medium text-primary underline-offset-4">View booking</span>
          </button>

          <div className="flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between min-[380px]:gap-3">
            {showBack && onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={onBack}
                className={cn(
                  backGhostClass,
                  "h-11 w-full min-[380px]:w-auto shrink-0 px-3 text-[13px] min-[380px]:px-3 min-[380px]:text-[14px]",
                )}
              >
                ← Back
              </Button>
            ) : null}
            <Button
              type="button"
              size="lg"
              disabled={!canProceed || pending}
              onClick={onPrimary}
              aria-describedby={!canProceed && blockedHint ? "prototype-cta-hint-mobile" : undefined}
              className={cn(
                primaryCtaClass,
                "h-11 text-[14px]",
                showBack ? "w-full min-[380px]:min-w-0 min-[380px]:flex-1" : "w-full",
              )}
            >
              {pending ? "One moment…" : cta.primary}
              {!pending ? <ArrowRight className="size-4 opacity-90" aria-hidden /> : null}
            </Button>
          </div>
          {!canProceed && blockedHint ? (
            <p id="prototype-cta-hint-mobile" className="text-center text-[11px] leading-snug text-muted-foreground">
              {blockedHint}
            </p>
          ) : null}
        </div>
      </div>

      <Drawer.Portal>
        <Drawer.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/[0.22] backdrop-blur-[2px] transition-[opacity,backdrop-filter] duration-300 ease-out",
            "data-[ending-style]:opacity-0 data-[ending-style]:backdrop-blur-none motion-reduce:transition-none",
            "dark:bg-black/45",
          )}
        />
        <Drawer.Viewport className="fixed inset-0 z-50 mx-auto flex max-h-[100dvh] max-w-lg flex-col justify-end p-0 outline-none">
          <Drawer.Popup
            className={cn(
              "relative z-50 flex max-h-[min(85dvh,540px)] w-full flex-col rounded-t-[1.35rem] border border-black/[0.06] bg-background shadow-[0_-12px_48px_-20px_rgba(15,23,42,0.18)] outline-none",
              "dark:border-white/[0.08] dark:bg-background dark:shadow-[0_-16px_56px_-16px_rgba(0,0,0,0.55)]",
              "transition-[transform,opacity] duration-300 ease-out data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 motion-reduce:transition-none",
            )}
          >
            <div className="flex shrink-0 flex-col border-b border-black/[0.045] px-5 pb-3 pt-3 dark:border-white/[0.06]">
              <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/20" aria-hidden />
              <div className="flex items-start justify-between gap-3">
                <Drawer.Title className="booking-display text-[1.05rem] font-normal leading-tight tracking-tight text-foreground">
                  Your booking
                </Drawer.Title>
                <Drawer.Close className="min-h-9 shrink-0 rounded-lg px-2 py-1 text-[13px] font-medium text-primary underline-offset-4 [-webkit-tap-highlight-color:transparent] transition-colors duration-200 hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
                  Done
                </Drawer.Close>
              </div>
              <Drawer.Description className="mt-1 text-[13px] leading-snug text-muted-foreground">
                Estimate and visit details.
              </Drawer.Description>
            </div>

            <Drawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <div className="space-y-5 pb-2">
                <BookingSummaryDetailBody draft={draft} />
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function PrototypeStickySummary({
  draft,
  canProceed,
  blockedHint,
  pending,
  onPrimary,
  onBack,
  showBack = false,
  variant,
  ctaPrimaryOverride,
  ctaReassuranceOverride,
}: {
  draft: BookingPrototypeDraft;
  canProceed: boolean;
  blockedHint: string | null;
  pending?: boolean;
  onPrimary: () => void;
  /** Step &gt; 1 — paired with Continue in the action row (does not alter navigation logic). */
  onBack?: () => void;
  showBack?: boolean;
  variant: "rail" | "mobile";
  ctaPrimaryOverride?: string;
  ctaReassuranceOverride?: string;
}) {
  const ctaBase = STEP_CTA[draft.step] ?? STEP_CTA[1];
  const cta = {
    primary: ctaPrimaryOverride ?? ctaBase.primary,
    reassurance: ctaReassuranceOverride ?? ctaBase.reassurance,
  };

  const isRail = variant === "rail";

  if (isRail) {
    return (
      <div
        className={cn(
          "sticky flex w-full max-h-[calc(100dvh-6rem)] flex-col gap-5 transition-shadow duration-300 ease-out motion-reduce:transition-none",
          bp.railStickyTop,
          bp.stickyRail,
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <BookingSummaryDetailBody draft={draft} />
        </div>

        <div className="shrink-0 space-y-2.5">
          <div className={cn("flex items-center gap-2", showBack ? "justify-between" : "flex-col")}>
            {showBack && onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={onBack}
                className={cn(backGhostClass, "h-[3.05rem] shrink-0 px-3 text-[14px]")}
              >
                ← Back
              </Button>
            ) : null}
            <Button
              type="button"
              size="lg"
              disabled={!canProceed || pending}
              onClick={onPrimary}
              aria-describedby={!canProceed && blockedHint ? "prototype-cta-hint" : undefined}
              className={cn(
                primaryCtaClass,
                "h-[3.05rem] text-[15px]",
                showBack ? "min-w-0 flex-1" : "w-full",
              )}
            >
              {pending ? "One moment…" : cta.primary}
              {!pending ? <ArrowRight className="size-4 opacity-90" aria-hidden /> : null}
            </Button>
          </div>
          {canProceed ? (
            <p className="text-center text-[11px] leading-snug text-muted-foreground">{cta.reassurance}</p>
          ) : blockedHint ? (
            <p id="prototype-cta-hint" className="text-center text-[11px] leading-snug text-muted-foreground">
              {blockedHint}
            </p>
          ) : (
            <p className="text-center text-[11px] leading-snug text-muted-foreground">{cta.reassurance}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <PrototypeStickySummaryMobile
      key={draft.step}
      draft={draft}
      canProceed={canProceed}
      blockedHint={blockedHint}
      pending={pending}
      onPrimary={onPrimary}
      onBack={onBack}
      showBack={showBack}
      cta={cta}
    />
  );
}
