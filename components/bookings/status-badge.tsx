import { Badge } from "@/components/ui/badge";
import { workforceBookingStatusLabel, workforcePaymentStatusLabel } from "@/lib/operations/workforce-copy";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<string, string> = {
  draft: "border-amber-600/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  awaiting_payment: "border-orange-600/40 bg-orange-500/10 text-orange-950 dark:text-orange-100",
  paid: "border-emerald-600/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
  assigned: "border-sky-600/40 bg-sky-500/10 text-sky-950 dark:text-sky-100",
  cleaner_en_route: "border-cyan-600/40 bg-cyan-500/10",
  cleaner_arrived: "border-teal-600/40 bg-teal-500/10 text-teal-950 dark:text-teal-100",
  in_progress: "border-blue-600/40 bg-blue-500/10",
  completed: "border-zinc-500/40 bg-zinc-500/10",
  cancelled: "border-red-600/40 bg-red-500/10 text-red-950 dark:text-red-100",
  refunded: "border-violet-600/40 bg-violet-500/10",
};

const PAYMENT_CLASS: Record<string, string> = {
  pending: "border-amber-600/40 bg-amber-500/10",
  processing: "border-sky-600/40 bg-sky-500/10",
  requires_action: "border-orange-600/40 bg-orange-500/10",
  succeeded: "border-emerald-600/40 bg-emerald-500/10",
  failed: "border-red-600/40 bg-red-500/10",
  canceled: "border-zinc-500/40 bg-zinc-500/10",
  refunded: "border-violet-600/40 bg-violet-500/10",
  partially_refunded: "border-violet-600/40 bg-violet-500/10",
};

const BOOKING_CUSTOMER_LABEL: Record<string, string> = {
  draft: "Draft — payment not started",
  awaiting_payment: "Payment pending — retry anytime",
  paid: "Payment confirmed",
  assigned: "Cleaner confirmed",
  cleaner_en_route: "On the way",
  cleaner_arrived: "Cleaner arrived",
  in_progress: "Clean in progress",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const PAYMENT_CUSTOMER_LABEL: Record<string, string> = {
  pending: "Processing",
  processing: "Processing",
  requires_action: "Action needed",
  succeeded: "Paid",
  failed: "Unsuccessful",
  canceled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export function BookingStatusBadge({
  status,
  customerFacing = false,
  workforce = false,
}: {
  status: string;
  customerFacing?: boolean;
  /** Cleaner / dispatch surfaces — readable, non-monospace. */
  workforce?: boolean;
}) {
  const label = customerFacing
    ? (BOOKING_CUSTOMER_LABEL[status] ?? status.replace(/_/g, " "))
    : workforce
      ? workforceBookingStatusLabel(status)
      : status;

  const sans = customerFacing || workforce;

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", STATUS_CLASS[status] ?? "")}>
      <span className={cn(!sans && "font-mono text-[11px]")}>{label}</span>
    </Badge>
  );
}

export function PaymentStatusBadge({
  status,
  customerFacing = false,
  workforce = false,
}: {
  status: string;
  customerFacing?: boolean;
  workforce?: boolean;
}) {
  const label = customerFacing
    ? (PAYMENT_CUSTOMER_LABEL[status] ?? status.replace(/_/g, " "))
    : workforce
      ? workforcePaymentStatusLabel(status)
      : status;

  const sans = customerFacing || workforce;

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", PAYMENT_CLASS[status] ?? "")}>
      <span className={cn(!sans && "font-mono text-[11px]")}>{label}</span>
    </Badge>
  );
}
