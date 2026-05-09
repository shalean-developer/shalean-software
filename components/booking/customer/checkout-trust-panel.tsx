import { Lock, ShieldCheck } from "lucide-react";

export function CheckoutTrustPanel() {
  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-semibold">Secure checkout with Paystack</p>
          <p className="leading-relaxed text-muted-foreground">
            Card and wallet payments are processed by Paystack — we never store your card details. After you pay,
            you&apos;ll return here while we verify the charge and lock in your booking.
          </p>
        </div>
      </div>
      <div className="flex gap-3 border-t border-border/60 pt-4">
        <Lock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-semibold">What happens next</p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>You&apos;ll leave this screen once to complete payment.</li>
            <li>If checkout was interrupted, use retry — Paystack reconciles duplicate attempts safely.</li>
            <li>When payment succeeds, your booking shows as confirmed and operations can assign a cleaner.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
