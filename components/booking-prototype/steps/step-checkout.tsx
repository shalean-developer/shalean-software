"use client";

import { Lock, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  getCheckoutPreferenceSurchargeNote,
  getCleanerPreferenceSummaryLine,
  getPreferenceReviewHeading,
} from "../cleaner-preference";
import { EstimateTotalPulse } from "../estimate-total-pulse";
import { computeMockQuote, ESTIMATE_REASSURANCE, formatZar } from "../mock-pricing";
import { PrototypeSwitch } from "../prototype-toggle";

import type { BookingPrototypeDraft } from "../types";
import { bp, bpOverline, bpSectionHeading } from "../visual-system";

export function StepCheckout({
  draft,
  termsAccepted,
  onTermsChange,
}: {
  draft: BookingPrototypeDraft;
  termsAccepted: boolean;
  onTermsChange: (next: boolean) => void;
}) {
  const quote = computeMockQuote(draft);

  return (
    <div className="space-y-7">
      <section className={bp.section}>
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6 stroke-[1.5]" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1 pt-0.5">
            <h2 className={cn(bpSectionHeading, "text-[1.05rem]")}>Secure checkout</h2>
            <p className="text-[14px] font-normal leading-relaxed text-muted-foreground">
              Cards are handled by our payments partner — never stored here.
            </p>
          </div>
        </div>

        <div className={cn(bp.well, "mt-7")}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <p className={bpOverline}>{quote?.totalLabel ?? "Estimated visit total"}</p>
              {quote ? (
                <p className="text-[12px] font-medium text-muted-foreground">
                  Estimated duration · {quote.estimatedDurationLabel}
                </p>
              ) : null}
              <p className="max-w-sm text-[13px] leading-snug text-muted-foreground">{ESTIMATE_REASSURANCE}</p>
            </div>
            {quote ? (
              <EstimateTotalPulse value={quote.totalZar}>
                <p className="text-[1.85rem] font-semibold tabular-nums tracking-tight text-foreground">
                  {formatZar(quote.totalZar)}
                </p>
              </EstimateTotalPulse>
            ) : (
              <p className="text-[1.85rem] font-semibold tabular-nums tracking-tight text-foreground">—</p>
            )}
          </div>
          <p className="mt-5 border-t border-black/[0.05] pt-4 text-[12px] leading-snug text-muted-foreground dark:border-white/[0.06]">
            Preview only — no charge. When live, you approve this amount before paying.
          </p>
        </div>

        <div className={cn(bp.wellQuiet, "mt-6 space-y-2")}>
          <p className={bpOverline}>{getPreferenceReviewHeading(draft)}</p>
          <p className="text-[13px] font-medium leading-snug text-foreground">{getCleanerPreferenceSummaryLine(draft)}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Preferences are subject to availability — gentle routing, not guaranteed assignment.
          </p>
          {draft.cleanerPreferenceMode === "preferred_cleaner" ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground/90">{getCheckoutPreferenceSurchargeNote(draft)}</p>
          ) : null}
        </div>

        <div className={cn(bp.wellQuiet, "mt-6 flex gap-3")}>
          <Lock className="mt-0.5 size-[18px] shrink-0 text-primary opacity-90" aria-hidden />
          <p className="text-[13px] leading-snug text-muted-foreground">
            Look for the browser padlock on the live payment screen.
          </p>
        </div>

        <div
          className={cn(
            "mt-7 flex items-start gap-3 rounded-xl px-3 py-3.5 transition-colors duration-150 sm:gap-4 sm:px-4 sm:py-4",
            "bg-muted/15 ring-1 ring-border/60 hover:bg-muted/25",
          )}
        >
          <span className="mt-0.5 shrink-0">
            <PrototypeSwitch
              id="prototype-checkout-terms"
              checked={termsAccepted}
              onCheckedChange={onTermsChange}
              aria-label="I’m ready to finish this preview booking"
            />
          </span>
          <label htmlFor="prototype-checkout-terms" className="cursor-pointer text-[14px] leading-snug text-muted-foreground">
            <span className="font-medium text-foreground">I’m ready to finish.</span> This preview doesn’t charge me.
            When checkout is live, I’ll confirm this amount before paying.
          </label>
        </div>
      </section>
    </div>
  );
}
