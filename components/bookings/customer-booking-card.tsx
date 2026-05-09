import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  customerBookingScheduleHeadline,
  customerBookingStatusHint,
} from "@/lib/bookings/customer-flow/booking-status-copy";
import type { CustomerBookingListRow } from "@/lib/bookings/customer-flow";
import { formatCustomerBookingRange } from "@/lib/bookings/customer-flow/display-schedule";
import { customerRebookUrl } from "@/lib/bookings/customer-flow/rebook-search-params";
import { cn } from "@/lib/utils";

import { BookingStatusBadge } from "./status-badge";

function scheduleSummary(row: CustomerBookingListRow): string {
  try {
    return formatCustomerBookingRange(row.scheduled_start, row.scheduled_end);
  } catch {
    return row.scheduled_start;
  }
}

export function CustomerBookingCard({ row }: { row: CustomerBookingListRow }) {
  const needsPay = row.status === "draft" || row.status === "awaiting_payment";
  const hint = customerBookingStatusHint(row.status);
  const scheduleHeadline = customerBookingScheduleHeadline(row.status);

  const payPrimaryLabel =
    row.status === "awaiting_payment" ? "Retry secure payment" : "Continue to payment";

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3 border-b border-border/60 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <BookingStatusBadge status={row.status} customerFacing />
          <Link
            href={`/bookings/${row.id}`}
            className="inline-flex items-center gap-0.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Details
            <ChevronRight className="size-4 opacity-80" aria-hidden />
          </Link>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{scheduleHeadline}</p>
          <p className="mt-1 text-base font-semibold leading-snug">{scheduleSummary(row)}</p>
          <p className="mt-2 text-sm font-medium leading-snug">{row.address_line1}</p>
          {[row.locality, row.region].filter(Boolean).length > 0 ? (
            <p className="text-xs text-muted-foreground">{[row.locality, row.region].filter(Boolean).join(", ")}</p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-4 py-3 sm:px-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Total</span>{" "}
            <span className="font-semibold tabular-nums">
              {(row.total_cents / 100).toLocaleString()} {row.currency}
            </span>
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-muted/10 px-4 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-5">
        {needsPay ? (
          <Link
            href={`/bookings/${row.id}/confirm`}
            className={cn(buttonVariants({ size: "lg" }), "w-full touch-manipulation sm:w-auto sm:min-w-[200px]")}
          >
            {payPrimaryLabel}
          </Link>
        ) : row.status === "completed" ? (
          <>
            <Link
              href={customerRebookUrl(row)}
              className={cn(buttonVariants({ size: "lg" }), "w-full touch-manipulation sm:w-auto sm:min-w-[200px]")}
            >
              Repeat visit
            </Link>
            <Link
              href={`/bookings/${row.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full touch-manipulation sm:w-auto")}
            >
              View booking
            </Link>
          </>
        ) : (
          <Link
            href={`/bookings/${row.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full touch-manipulation sm:w-auto")}
          >
            View booking
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
