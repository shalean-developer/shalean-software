import { customerBookingStatusHint } from "@/lib/bookings/customer-flow/booking-status-copy";
import { cn } from "@/lib/utils";

export function OperationalStatusCallout({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground",
        className,
      )}
      role="status"
    >
      {customerBookingStatusHint(status)}
    </div>
  );
}
