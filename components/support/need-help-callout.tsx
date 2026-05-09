import { Headphones } from "lucide-react";

import { cn } from "@/lib/utils";

type NeedHelpCalloutProps = {
  className?: string;
  /** Compact single line for dense layouts */
  compact?: boolean;
};

export function NeedHelpCallout({ className, compact }: NeedHelpCalloutProps) {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-muted/25 px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <div className={cn("flex gap-3", compact && "items-center")}>
        <Headphones className={cn("size-5 shrink-0 text-primary", compact && "size-4")} aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className={cn("font-medium text-foreground", compact ? "text-sm" : "text-base")}>Need help?</p>
          {supportEmail ? (
            <p className={cn("leading-relaxed", compact && "text-xs")}>
              Email{" "}
              <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>{" "}
              for booking or payment questions — include your booking reference if you have one.
            </p>
          ) : (
            <p className={cn("leading-relaxed", compact && "text-xs")}>
              Open any booking for payment retry and live status. If something looks stuck after payment, wait a minute
              and refresh — verification usually completes quickly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
