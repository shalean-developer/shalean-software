"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { BOOKING_EXTRAS, BOOKING_SERVICES } from "@/lib/booking/catalog";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { BookingPrototypeShell } from "./booking-prototype-shell";
import { PROTOTYPE_SUBURBS } from "./mock-data";
import { computeMockQuote, formatZar } from "./mock-pricing";
import { useBookingPersistenceBridge } from "./persistence-bridge";
import {
  getServicePreferenceMode,
  isCleanerPreferenceStepComplete,
  preferenceStepSubtitle,
  preferenceStepTitle,
} from "./cleaner-preference";
import {
  nextExtrasOnQuantity,
  nextExtrasOnToggle,
  pruneExtrasForService,
} from "./extras-compat";
import { prototypeProceedBlockedHint } from "./prototype-conversion-hints";
import { PrototypeStickySummary } from "./prototype-sticky-summary";
import { isServiceDetailsComplete } from "./service-details-validation";
import { INITIAL_BOOKING_PROTOTYPE_DRAFT, type BookingPrototypeDraft, type BookingPrototypeStep } from "./types";
import { bp } from "./visual-system";
import { StepCustomize } from "./steps/step-customize";
import { StepCheckout } from "./steps/step-checkout";
import { StepCleanerPreference } from "./steps/step-cleaner-preference";
import { StepHomeDetails } from "./steps/step-home-details";
import { StepReview } from "./steps/step-review";
import { StepSelectService } from "./steps/step-select-service";
import { StepWhereWhen } from "./steps/step-where-when";

const STEP_COPY: Record<BookingPrototypeStep, { title: string; subtitle: string }> = {
  1: {
    title: "Choose your visit",
    subtitle: "Each option shapes timing, add-ons, and your estimate.",
  },
  2: {
    title: "Where & when?",
    subtitle: "Neighbourhood, day, and arrival preference.",
  },
  3: {
    title: "About your space",
    subtitle: "Just what we need for this visit type.",
  },
  4: {
    title: "Add-ons",
    subtitle: "Optional — skip anything you don’t need.",
  },
  5: {
    title: "Cleaner preference",
    subtitle: "Choose how you’d like us to match your visit — gentle preferences, never a guarantee.",
  },
  6: {
    title: "Review",
    subtitle: "Everything together — visit, preference, and contact before checkout.",
  },
  7: {
    title: "Checkout",
    subtitle: "Secure payment when live — this preview won’t charge you.",
  },
};

function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function BookingPrototypeFlow({ supportEmail }: { supportEmail: string | null }) {
  const [draft, setDraft] = useState<BookingPrototypeDraft>(INITIAL_BOOKING_PROTOTYPE_DRAFT);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [persistedBookingId, setPersistedBookingId] = useState<string | null>(null);
  const { persistFinishedBooking } = useBookingPersistenceBridge();
  /** Step 6 (Review): contact fields stay hidden until user taps Continue the first time. */
  const [reviewContactRevealed, setReviewContactRevealed] = useState(false);
  const reviewContactScrollPendingRef = useRef(false);
  const reviewContactSectionRef = useRef<HTMLDivElement | null>(null);

  /** Real-device UX: avoid mid-scroll step changes (keyboard + sticky footer). */
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [draft.step]);

  useLayoutEffect(() => {
    if (finished) window.scrollTo(0, 0);
  }, [finished]);

  useLayoutEffect(() => {
    if (!reviewContactScrollPendingRef.current || !reviewContactRevealed || draft.step !== 6) return;
    reviewContactScrollPendingRef.current = false;
    const raf = requestAnimationFrame(() => {
      reviewContactSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      requestAnimationFrame(() => {
        document.getElementById("prototype-name")?.focus({ preventScroll: true });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [reviewContactRevealed, draft.step]);

  const updateDraft = useCallback((patch: Partial<BookingPrototypeDraft>) => {
    setDraft((d) => {
      const next: BookingPrototypeDraft = { ...d, ...patch };
      if (patch.serviceType !== undefined && patch.serviceType !== d.serviceType) {
        next.extras = pruneExtrasForService(d.extras, patch.serviceType);
        next.cleanerPreferenceMode = "best_available";
        next.preferredCleanerId = "";
      }
      return next;
    });
  }, []);

  const toggleExtra = useCallback((id: string) => {
    const def = BOOKING_EXTRAS.find((e) => e.id === id);
    if (!def) return;
    setDraft((d) => ({
      ...d,
      extras: nextExtrasOnToggle(d.extras, def),
    }));
  }, []);

  const setExtraQuantity = useCallback((id: string, quantity: number) => {
    const def = BOOKING_EXTRAS.find((e) => e.id === id);
    if (!def) return;
    setDraft((d) => ({
      ...d,
      extras: nextExtrasOnQuantity(d.extras, def, quantity),
    }));
  }, []);

  const canProceed = useMemo(() => {
    switch (draft.step) {
      case 1:
        return Boolean(draft.serviceType);
      case 2:
        return Boolean(draft.suburbId && draft.preferredDate && draft.timeWindow);
      case 3:
        return isServiceDetailsComplete(draft);
      case 4:
        return true;
      case 5:
        return isCleanerPreferenceStepComplete(draft);
      case 6:
        if (!reviewContactRevealed) return true;
        return (
          draft.fullName.trim().length >= 2 &&
          looksLikeEmail(draft.email) &&
          draft.phone.trim().length >= 8
        );
      case 7:
        return termsAccepted;
      default:
        return false;
    }
  }, [draft, termsAccepted, reviewContactRevealed]);

  const blockedHint = useMemo(
    () =>
      !canProceed ? prototypeProceedBlockedHint(draft, termsAccepted, reviewContactRevealed) : null,
    [canProceed, draft, termsAccepted, reviewContactRevealed],
  );

  const handlePrimary = useCallback(() => {
    if (draft.step === 6 && !reviewContactRevealed) {
      setReviewContactRevealed(true);
      reviewContactScrollPendingRef.current = true;
      return;
    }
    if (!canProceed) return;
    if (draft.step === 7) {
      const bookingId = persistFinishedBooking(draft);
      if (bookingId) setPersistedBookingId(bookingId);
      setFinished(true);
      return;
    }
    setDraft((d) => ({ ...d, step: (d.step + 1) as BookingPrototypeStep }));
  }, [canProceed, draft, persistFinishedBooking, reviewContactRevealed]);

  const reviewStepCta = useMemo(() => {
    if (draft.step !== 6) return null;
    if (!reviewContactRevealed) {
      return {
        primary: "Continue",
        reassurance: "Next: your contact details.",
      };
    }
    return {
      primary: "Continue",
      reassurance: "Next: secure checkout preview.",
    };
  }, [draft.step, reviewContactRevealed]);

  const handleBack = useCallback(() => {
    setTermsAccepted(false);
    setDraft((d) => {
      if (d.step <= 1) return d;
      return { ...d, step: (d.step - 1) as BookingPrototypeStep };
    });
  }, []);

  const restart = useCallback(() => {
    setDraft(INITIAL_BOOKING_PROTOTYPE_DRAFT);
    setTermsAccepted(false);
    setFinished(false);
    setPersistedBookingId(null);
    setReviewContactRevealed(false);
  }, []);

  const copy = useMemo(() => {
    const base = STEP_COPY[draft.step];
    if (draft.step !== 5) return base;
    const prefMode = getServicePreferenceMode(draft.serviceType);
    return {
      title: preferenceStepTitle(prefMode),
      subtitle: preferenceStepSubtitle(prefMode),
    };
  }, [draft.step, draft.serviceType]);

  const preferenceSegmentLabel = draft.step === 5 ? (getServicePreferenceMode(draft.serviceType) === "team" ? "Team" : "Cleaner") : null;

  const quote = computeMockQuote(draft);
  const service = BOOKING_SERVICES.find((s) => s.slug === draft.serviceType);
  const suburb = PROTOTYPE_SUBURBS.find((s) => s.id === draft.suburbId);

  if (finished) {
    return (
      <div className={bp.pageRoot}>
        <header className={bp.unifiedNavShell} aria-label="Booking preview complete">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
            <Link href="/" className={cn(bp.navWordmark, "text-[15px] sm:text-base")}>
              Shalean
            </Link>
            <span className={bp.badge}>Preview complete</span>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
          <div className={cn(bp.section, "p-6 sm:p-9")}>
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <CheckCircle2 className="size-7 stroke-[1.5]" aria-hidden />
              </span>
              <div className="space-y-2 pt-0.5">
                <h1 className="booking-display text-[1.35rem] font-normal leading-tight tracking-tight sm:text-[1.5rem]">
                  You&apos;re done (preview)
                </h1>
                <p className="text-[14px] font-normal leading-relaxed text-muted-foreground">
                  No charge in this walkthrough. When live, confirmation lands in your inbox.
                </p>
              </div>
            </div>

            <div className={cn(bp.well, "mt-6 space-y-3 text-sm")}>
              <p className="font-medium text-foreground">Summary</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <span className="text-foreground">{service?.title ?? "Visit"}</span>
                  <span className="text-muted-foreground"> · </span>
                  {suburb?.label ?? "Area"}
                </li>
                <li>
                  {quote ? (
                    <>
                      Estimated total{" "}
                      <span className="font-semibold tabular-nums text-foreground">{formatZar(quote.totalZar)}</span>
                    </>
                  ) : (
                    "Estimate wasn’t available — complete details in the flow to see one."
                  )}
                </li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button type="button" size="lg" className="h-12 w-full touch-manipulation sm:w-auto" onClick={restart}>
                Book another preview
              </Button>
              {persistedBookingId ? (
                <Link
                  href="/prototype/customer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "inline-flex h-12 w-full items-center justify-center touch-manipulation sm:w-auto",
                  )}
                >
                  Open my dashboard
                </Link>
              ) : (
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "inline-flex h-12 w-full items-center justify-center touch-manipulation sm:w-auto",
                  )}
                >
                  Back to home
                </Link>
              )}
            </div>

            {supportEmail ? (
              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                Prefer a human touch first?{" "}
                <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </p>
            ) : (
              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                Questions welcome — when we launch, a caring team sits behind this flow.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <BookingPrototypeShell
      currentStep={draft.step}
      currentSegmentLabel={preferenceSegmentLabel}
      title={copy.title}
      subtitle={copy.subtitle}
    >
      <div className="pb-[calc(10.85rem+env(safe-area-inset-bottom))] md:grid md:min-h-0 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:items-stretch md:gap-10 md:pb-10 lg:gap-12">
        <div className="min-h-0 min-w-0 space-y-7">
          <div key={draft.step} className={bp.stepEnter}>
            {draft.step === 1 ? <StepSelectService draft={draft} updateDraft={updateDraft} /> : null}
            {draft.step === 2 ? <StepWhereWhen draft={draft} updateDraft={updateDraft} /> : null}
            {draft.step === 3 ? <StepHomeDetails draft={draft} updateDraft={updateDraft} /> : null}
            {draft.step === 4 ? (
              <StepCustomize
                draft={draft}
                updateDraft={updateDraft}
                toggleExtra={toggleExtra}
                setExtraQuantity={setExtraQuantity}
              />
            ) : null}
            {draft.step === 5 ? <StepCleanerPreference draft={draft} updateDraft={updateDraft} /> : null}
            {draft.step === 6 ? (
              <StepReview
                draft={draft}
                updateDraft={updateDraft}
                supportEmail={supportEmail}
                contactRevealed={reviewContactRevealed}
                contactSectionRef={reviewContactSectionRef}
              />
            ) : null}
            {draft.step === 7 ? (
              <StepCheckout draft={draft} termsAccepted={termsAccepted} onTermsChange={setTermsAccepted} />
            ) : null}
          </div>
        </div>

        <aside className="mt-10 hidden min-h-0 md:mt-0 md:block">
          <PrototypeStickySummary
            variant="rail"
            draft={draft}
            canProceed={canProceed}
            blockedHint={blockedHint}
            onPrimary={handlePrimary}
            showBack={draft.step > 1}
            onBack={handleBack}
            ctaPrimaryOverride={reviewStepCta?.primary}
            ctaReassuranceOverride={reviewStepCta?.reassurance}
          />
        </aside>
      </div>

      <PrototypeStickySummary
        variant="mobile"
        draft={draft}
        canProceed={canProceed}
        blockedHint={blockedHint}
        onPrimary={handlePrimary}
        showBack={draft.step > 1}
        onBack={handleBack}
        ctaPrimaryOverride={reviewStepCta?.primary}
        ctaReassuranceOverride={reviewStepCta?.reassurance}
      />
    </BookingPrototypeShell>
  );
}
