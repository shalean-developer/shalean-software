import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";

import { BookingStatusBadge } from "@/components/bookings/status-badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getCleanerLinearNextStatus, type CleanerBookingCardRow } from "@/lib/cleaner/operations";
import { formatCustomerBookingRange } from "@/lib/bookings/customer-flow/display-schedule";
import { isBookingStatus } from "@/lib/bookings/lifecycle";

import { CleanerBookingAdvanceForm } from "./cleaner-booking-advance-form";

function scheduleLine(row: CleanerBookingCardRow): string {
  try {
    return formatCustomerBookingRange(row.scheduled_start, row.scheduled_end);
  } catch {
    return row.scheduled_start;
  }
}

export function CleanerBookingCard(props: { row: CleanerBookingCardRow }) {
  const { row } = props;
  const next = isBookingStatus(row.status) ? getCleanerLinearNextStatus(row.status) : null;

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3 border-b border-border/60 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <BookingStatusBadge status={row.status} workforce />
          <Link
            href={`/cleaner/jobs/${row.id}`}
            className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Full details
            <ChevronRight className="size-4 opacity-80" aria-hidden />
          </Link>
        </div>
        <div className="flex gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Where</p>
            <p className="text-base font-semibold leading-snug">{row.address_line1}</p>
            <p className="text-sm text-muted-foreground">
              {[row.locality, row.region].filter(Boolean).join(", ") || null}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Service window</p>
          <p className="mt-1 text-sm font-medium">{scheduleLine(row)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 py-3 sm:px-5">
        {row.service_notes ? (
          <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer notes</p>
            <p className="mt-1 line-clamp-4 text-sm leading-relaxed">{row.service_notes}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No special instructions on file.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-muted/10 px-4 py-4 sm:px-5">
        {next ? (
          <CleanerBookingAdvanceForm
            bookingId={row.id}
            rowVersion={row.row_version}
            currentStatus={row.status}
            nextStatus={next}
          />
        ) : (
          <p className="py-2 text-center text-sm text-muted-foreground">
            {row.status === "completed" ? "Completed — great work." : "No field actions for this status."}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
