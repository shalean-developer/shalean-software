"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BookingStickySummaryProps = {
  formId: string;
  scheduleLine: string;
  addressLine: string;
  totalLine: string;
  pending: boolean;
  formError: string | null;
  /** Desktop sticky aside */
  variant: "rail" | "mobile";
};

export function BookingStickySummary({
  formId,
  scheduleLine,
  addressLine,
  totalLine,
  pending,
  formError,
  variant,
}: BookingStickySummaryProps) {
  const isRail = variant === "rail";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur-md",
        isRail && "sticky top-24",
        !isRail &&
          "fixed inset-x-0 bottom-0 z-40 rounded-none rounded-t-xl border-x-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:hidden",
      )}
    >
      <div className={cn("space-y-1 text-sm", !isRail && "px-1")}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your booking</p>
        <p className="font-medium leading-snug">{scheduleLine}</p>
        <p className="line-clamp-2 text-muted-foreground">{addressLine}</p>
        <p className="text-base font-semibold">{totalLine}</p>
      </div>
      {formError ? (
        <p className="text-xs text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      <Button
        type="submit"
        form={formId}
        disabled={pending}
        size="lg"
        className={cn("w-full touch-manipulation", isRail && "mt-1")}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          "Continue to review"
        )}
      </Button>
      {!isRail ? (
        <p className="text-center text-[11px] text-muted-foreground">
          Next: confirm details & pay securely with Paystack.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          You&apos;ll review everything on the next step before payment.
        </p>
      )}
    </div>
  );
}
