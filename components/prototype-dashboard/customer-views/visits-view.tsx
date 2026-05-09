"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ban,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";
import { formatZar } from "@/components/booking-prototype/mock-pricing";

import { BookingStatusChip, CleanerStatusChip, OperationalSignalsRow } from "../dashboard-status-chip";
import { customerSectionClass } from "../customer-dashboard-ui";
import { useCustomerWorkflow } from "../customer-workflow-context";
import { customerHasPastVisits, customerHasUpcomingBookings } from "../customer-dashboard-visibility";
import {
  MOCK_ASSIGNED_CLEANER,
  MOCK_DETAIL_BOOKING,
  MOCK_FREQUENCY_PREF,
  MOCK_PAST,
  MOCK_SAVED_ADDRESS,
  MOCK_UPCOMING,
} from "../mock-customer-data";

const FILTERS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function VisitsView() {
  const hasUpcoming = customerHasUpcomingBookings();
  const hasPast = customerHasPastVisits();
  const { getBooking, openDetail, navigate, primaryBookingId, pushToast } = useCustomerWorkflow();
  const [expandedId, setExpandedId] = useState<string | null>(MOCK_UPCOMING[0]?.id ?? null);
  const [filter, setFilter] = useState<FilterId>("upcoming");

  const toggle = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  const liveUpcoming = MOCK_UPCOMING.map((b) => getBooking(b.id)!);
  const showUpcoming = filter !== "past";
  const showPast = filter !== "upcoming";

  const handleMessageVisit = () => {
    pushToast({
      tone: "primary",
      title: "Opened message thread",
      body: "We'll route this to the support team.",
    });
    navigate("messages");
  };

  return (
    <div className="space-y-3 pb-2 md:space-y-4">
      <div>
        <p className={bpOverline}>Bookings</p>
        <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.5rem]">
          Your visits
        </h1>
        <p className="mt-1 max-w-lg text-[12px] text-muted-foreground sm:text-[13px]">
          {hasUpcoming ? "Upcoming and past cleans." : "Your calendar will appear here after you book."}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Visit filter">
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wide ring-1 motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.97]",
                on
                  ? "bg-primary/[0.1] text-primary ring-primary/30"
                  : "bg-muted/30 text-muted-foreground ring-border/70 hover:bg-muted/55 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {primaryBookingId ? (
        <div className="sticky top-[calc(3.25rem+env(safe-area-inset-top,0px))] z-20 -mx-1 mb-1 md:hidden">
          <div className="flex gap-2 rounded-2xl border border-border/70 bg-background/95 p-2 shadow-[0_8px_30px_-16px_rgba(15,23,42,0.18)] backdrop-blur-md supports-[backdrop-filter]:bg-background/88">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-10 flex-1 touch-manipulation rounded-xl text-[12px] shadow-sm"
              onClick={() => openDetail({ kind: "reschedule", bookingId: primaryBookingId })}
            >
              <CalendarDays className="size-3.5" aria-hidden />
              Reschedule
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 flex-1 touch-manipulation rounded-xl text-[12px]"
              onClick={handleMessageVisit}
            >
              <MessageCircle className="size-3.5" aria-hidden />
              Message
            </Button>
          </div>
        </div>
      ) : null}

      {showUpcoming ? (
        <section className={customerSectionClass({ priority: "default" })}>
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Upcoming</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">On your calendar</p>
          {!hasUpcoming ? (
            <div className="mt-2.5 rounded-xl border border-dashed border-border/65 bg-muted/[0.1] px-4 py-5 text-center sm:px-5">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.06] text-primary">
                <CalendarDays className="size-[1.15rem]" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="text-[14px] font-medium text-foreground">Nothing scheduled</p>
              <p className="mx-auto mt-0.5 max-w-sm text-[12px] text-muted-foreground">Book a visit to see dates and status here.</p>
              <Link
                href="/prototype/booking"
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-3 inline-flex rounded-xl")}
              >
                Book your first visit
              </Link>
            </div>
          ) : null}
          <ul className={cn("mt-2.5 space-y-3", !hasUpcoming && "hidden")}>
            {liveUpcoming.map((b, index) => {
              const open = expandedId === b.id;
              const isPrimary = index === 0;
              const cancelled = b.isCancelled || b.bookingStatus === "cancelled";
              return (
                <li
                  key={b.id}
                  className={cn(
                    "touch-pan-y rounded-2xl border border-border/65 bg-muted/[0.12] p-4 ring-1 ring-border/35 motion-safe:transition-[box-shadow,transform,border-color] motion-safe:duration-300 sm:p-5",
                    "snap-start snap-always hover:border-primary/18 hover:shadow-[0_14px_40px_-28px_rgba(53,99,255,0.22)] motion-safe:hover:-translate-y-px",
                    isPrimary && !cancelled && "border-primary/12 bg-gradient-to-b from-primary/[0.04] to-transparent",
                    cancelled && "opacity-80",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openDetail({ kind: "visit", bookingId: b.id })}
                      className="min-w-0 flex-1 space-y-2.5 text-left motion-safe:transition-colors hover:text-primary"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-semibold text-foreground">{b.serviceLabel}</span>
                        <BookingStatusChip status={b.bookingStatus} />
                        <CleanerStatusChip status={b.cleanerStatus} />
                        {b.recurringReserved ? (
                          <span className="rounded-full border border-primary/20 bg-primary/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Recurring
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[13px] text-muted-foreground">
                        {b.dateLabel} · {b.timeLabel} · {b.areaLabel}
                      </p>
                      <OperationalSignalsRow items={b.operationalChips} limit={3} />
                      <p className="text-[12px] leading-snug text-muted-foreground">
                        Estimated duration ·{" "}
                        <span className="font-medium text-foreground/85">{b.estimatedDurationLabel}</span>
                        <span className="mx-1.5 text-border">·</span>
                        {b.extrasSummary}
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-foreground">{formatZar(b.estimateZar)}</p>
                      {isPrimary ? (
                        <p className="text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground">{MOCK_ASSIGNED_CLEANER.name}</span>
                          <span className="text-muted-foreground"> · </span>
                          {MOCK_ASSIGNED_CLEANER.rating} ★
                        </p>
                      ) : null}
                    </button>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {cancelled ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-[12px] touch-manipulation"
                          onClick={() => openDetail({ kind: "rebook", bookingId: b.id })}
                        >
                          <RefreshCw className="size-3.5" aria-hidden />
                          Rebook
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-[12px] touch-manipulation"
                            onClick={() => openDetail({ kind: "reschedule", bookingId: b.id })}
                          >
                            <CalendarDays className="size-3.5" aria-hidden />
                            Reschedule
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg text-[12px] text-muted-foreground touch-manipulation"
                            onClick={() => openDetail({ kind: "cancel", bookingId: b.id })}
                          >
                            <Ban className="size-3.5" aria-hidden />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggle(b.id)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2 text-[12px] font-medium text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:border-primary/25 hover:bg-muted/30 hover:text-foreground"
                    aria-expanded={open}
                  >
                    {open ? (
                      <>
                        <span>Less detail</span>
                        <ChevronUp className="size-4 opacity-80" aria-hidden />
                      </>
                    ) : (
                      <>
                        <span>More detail</span>
                        <ChevronDown className="size-4 opacity-80" aria-hidden />
                      </>
                    )}
                  </button>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="min-h-0 overflow-hidden" inert={!open ? true : undefined}>
                      <div className="mt-3 space-y-2 border-t border-border/50 pt-3 text-[12px] text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">Arrival · </span>
                          {b.arrivalConfidence}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Prep · </span>
                          {b.prepNote}
                        </p>
                        <p>
                          {b.preferredArrivalSummary} · {b.frequencyLabel} · {b.continuityLine}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 rounded-lg text-[11.5px] text-primary"
                            onClick={() => openDetail({ kind: "timeline", bookingId: b.id })}
                          >
                            View timeline
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 rounded-lg text-[11.5px] text-primary"
                            onClick={() => openDetail({ kind: "cleaner" })}
                          >
                            View cleaner
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 rounded-lg text-[11.5px] text-primary"
                            onClick={() => openDetail({ kind: "recurring", bookingId: b.id })}
                          >
                            Recurring
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {showPast ? (
        <section className={customerSectionClass({ priority: "default" })}>
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Past visits</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">History and rebook</p>
          {!hasPast ? (
            <div className="mt-2.5 rounded-xl border border-border/55 bg-muted/[0.08] px-4 py-4 sm:px-5">
              <p className="text-[14px] font-medium text-foreground">No visits yet</p>
              <p className="mt-0.5 max-w-md text-[12px] text-muted-foreground">Past cleans and rebook will show here.</p>
              <Link
                href="/prototype/booking"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-3 inline-flex rounded-xl")}
              >
                Book your first clean
              </Link>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Regular", "Deep Cleaning", "Recurring"].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    <Sparkles className="size-3 text-primary/80" aria-hidden />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <ul className={cn("mt-2.5 space-y-2", !hasPast && "hidden")}>
            {MOCK_PAST.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 hover:-translate-y-px hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => openDetail({ kind: "rebookPast", pastId: b.id })}
                  className="min-w-0 text-left"
                >
                  <p className="text-[14px] font-medium text-foreground">{b.serviceLabel}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {b.dateLabel} · {b.areaLabel}
                  </p>
                  {b.withPreferredCleaner ? (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary/90">With your preferred cleaner</p>
                  ) : null}
                  {b.ratingPlaceholder ? (
                    <p className="mt-0.5 text-[11px] font-medium text-primary">{b.ratingPlaceholder}</p>
                  ) : null}
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 shrink-0 touch-manipulation rounded-lg text-[12px]"
                  onClick={() => openDetail({ kind: "rebookPast", pastId: b.id })}
                >
                  <RefreshCw className="size-3" aria-hidden />
                  Rebook
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={customerSectionClass({ priority: "quiet" })}>
        <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>
          {MOCK_DETAIL_BOOKING ? "Visit snapshot" : "Before you book"}
        </h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {MOCK_DETAIL_BOOKING ? "Sample · next visit" : "Fills in after you book"}
        </p>
        {MOCK_DETAIL_BOOKING ? (
          <>
            <dl className="mt-3 grid gap-2.5 text-[13px] sm:grid-cols-2">
              <div className="rounded-xl bg-background/70 p-3 ring-1 ring-border/55">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Property</dt>
                <dd className="mt-1 font-medium text-foreground">{MOCK_SAVED_ADDRESS.line}</dd>
              </div>
              <div className="rounded-xl bg-background/70 p-3 ring-1 ring-border/55">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Frequency</dt>
                <dd className="mt-1 font-medium text-foreground">{MOCK_DETAIL_BOOKING.frequencyLabel}</dd>
              </div>
              <div className="rounded-xl bg-background/70 p-3 ring-1 ring-border/55 sm:col-span-2">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Estimated duration</dt>
                <dd className="mt-1 font-medium text-foreground">{MOCK_DETAIL_BOOKING.estimatedDurationLabel}</dd>
              </div>
              <div className="rounded-xl bg-background/70 p-3 ring-1 ring-border/55 sm:col-span-2">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Extras</dt>
                <dd className="mt-1 font-medium text-foreground">{MOCK_DETAIL_BOOKING.extrasSummary}</dd>
              </div>
              <div className="rounded-xl bg-background/70 p-3 ring-1 ring-border/55 sm:col-span-2">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Rhythm</dt>
                <dd className="mt-1 text-foreground">{MOCK_FREQUENCY_PREF}</dd>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3 sm:col-span-2">
                <dt className="text-[11px] font-medium text-primary">Estimate</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums text-foreground">{formatZar(MOCK_DETAIL_BOOKING.estimateZar)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 touch-manipulation rounded-lg text-[12px]"
                onClick={handleMessageVisit}
              >
                <MessageCircle className="size-3.5" aria-hidden />
                Message about this visit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 touch-manipulation rounded-lg text-[12px]"
                onClick={() => navigate("preferences")}
              >
                <MapPin className="size-3.5" aria-hidden />
                Update address
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="rounded-xl bg-background/70 p-3 ring-1 ring-border/55">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Property</p>
              <p className="mt-0.5 text-[13px] font-medium text-foreground">{MOCK_SAVED_ADDRESS.line}</p>
            </div>
            <div className="rounded-xl bg-background/70 p-3 ring-1 ring-border/55">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Rhythm</p>
              <p className="mt-0.5 text-[13px] text-foreground">{MOCK_FREQUENCY_PREF}</p>
            </div>
            <Link
              href="/prototype/booking"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 rounded-lg text-[12px]")}
            >
              Start a booking
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
