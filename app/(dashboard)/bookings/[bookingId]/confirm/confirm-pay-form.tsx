"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { confirmAndStartPaymentAction } from "@/lib/bookings/customer-flow/actions";
import { cn } from "@/lib/utils";
import { Loader2, Lock } from "lucide-react";

function SubmitLabel({ variant }: { variant: "default" | "retry" }) {
  const { pending } = useFormStatus();
  if (pending) {
    return (
      <span className="inline-flex items-center">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        Opening Paystack…
      </span>
    );
  }
  return <span>{variant === "retry" ? "Retry secure checkout" : "Continue to Paystack"}</span>;
}

export function ConfirmPayForm({
  bookingId,
  variant = "default",
}: {
  bookingId: string;
  variant?: "default" | "retry";
}) {
  return (
    <form action={confirmAndStartPaymentAction} className="flex flex-col gap-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <Button type="submit" size="lg" className={cn("w-full touch-manipulation sm:max-w-md")}>
        <SubmitLabel variant={variant} />
      </Button>
      <div className="flex gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2.5 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <p className="leading-relaxed">
          You&apos;ll leave Shalean briefly to authorize payment. When Paystack sends you back, we verify the charge and
          update your booking automatically — usually within a few seconds.
        </p>
      </div>
    </form>
  );
}
