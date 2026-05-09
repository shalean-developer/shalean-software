import Link from "next/link";

import { cn } from "@/lib/utils";

import { BookingHeaderAvatar } from "./booking-header-avatar";
import type { BookingPrototypeStep } from "./types";
import { bp } from "./visual-system";

const STEP_META: { step: BookingPrototypeStep; label: string }[] = [
  { step: 1, label: "Service" },
  { step: 2, label: "Where & when" },
  { step: 3, label: "Details" },
  { step: 4, label: "Extras" },
  { step: 5, label: "Cleaner" },
  { step: 6, label: "Review" },
  { step: 7, label: "Checkout" },
];

export function BookingPrototypeShell({
  currentStep,
  currentSegmentLabel,
  title,
  subtitle,
  children,
}: {
  currentStep: BookingPrototypeStep;
  /** When set (e.g. step 5 cleaner vs team), replaces the short segment label under the step counter. */
  currentSegmentLabel?: string | null;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const defaultMetaLabel = STEP_META.find((s) => s.step === currentStep)?.label;
  const activeLabel =
    currentStep === 5 && currentSegmentLabel != null && currentSegmentLabel !== ""
      ? currentSegmentLabel
      : defaultMetaLabel;
  const stepTotal = STEP_META.length;

  return (
    <div className={bp.pageRoot}>
      <header className={bp.unifiedNavShell} aria-label="Booking navigation">
        <div className="mx-auto max-w-6xl px-4 pb-2 pt-1 sm:px-6 sm:pb-2 sm:pt-1.5">
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <p className="text-center text-[12px] font-normal leading-snug tracking-tight text-muted-foreground sm:text-[13px]">
              <span className="tabular-nums text-muted-foreground">
                Step {currentStep} of {stepTotal}
              </span>
              {activeLabel ? (
                <>
                  <span className="text-muted-foreground/25" aria-hidden>
                    {" "}
                    ·{" "}
                  </span>
                  <span className="text-foreground/90">{activeLabel}</span>
                </>
              ) : null}
            </p>

            <div className="flex min-h-[2rem] items-center gap-1 sm:min-h-[2.25rem] sm:gap-2">
              <div className="w-20 shrink-0 sm:w-[5.25rem]" aria-hidden />

              <div
                className="flex min-w-0 flex-1 justify-center gap-1 px-0.5 sm:gap-1.5"
                role="list"
                aria-label={`Booking progress, step ${currentStep} of ${stepTotal}`}
              >
                {STEP_META.map(({ step }) => (
                  <span
                    key={step}
                    role="listitem"
                    title={
                      step === currentStep
                        ? `Current step ${step}: ${
                            currentStep === 5 && currentSegmentLabel
                              ? currentSegmentLabel
                              : (STEP_META.find((s) => s.step === step)?.label ?? "")
                          }`
                        : undefined
                    }
                    className={cn(bp.progressSegment, step <= currentStep ? bp.progressOn : bp.progressOff)}
                  />
                ))}
              </div>

              <div className="flex w-20 shrink-0 items-center justify-end gap-1.5 sm:w-[5.25rem] sm:gap-2">
                <Link href="/" className={cn(bp.navMutedLink, "whitespace-nowrap py-0.5 text-[11px] sm:text-xs")}>
                  Leave
                </Link>
                <BookingHeaderAvatar />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 sm:pb-14 sm:pt-8">
        <div className="mb-7 max-w-xl space-y-2.5 sm:mb-9 sm:space-y-3">
          <h1 className={bp.heroTitle}>{title}</h1>
          <p className={bp.heroSubtitle}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
