"use client";

import {
  Ban,
  CalendarDays,
  ChevronRight,
  MapPin,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";
import { formatZar } from "@/components/booking-prototype/mock-pricing";

import { BookingStatusChip, CleanerStatusChip, OperationalSignalsRow } from "../dashboard-status-chip";
import { CustomerBookingTimeline } from "../customer-booking-timeline";
import { customerSectionClass } from "../customer-dashboard-ui";
import { useCustomerWorkflow } from "../customer-workflow-context";
import {
  MOCK_ASSIGNED_CLEANER,
  MOCK_CUSTOMER,
  MOCK_PAST,
  MOCK_SAVED_ADDRESS,
  MOCK_UPCOMING,
} from "../mock-customer-data";

export function DashboardOverviewOperational() {
  const next = MOCK_UPCOMING[0]!;
  const later = MOCK_UPCOMING[1];
  const previewPast = MOCK_PAST.slice(0, 2);

  const { getBooking, openDetail, advanceBookingStatus, navigate } = useCustomerWorkflow();

  const liveNext = getBooking(next.id)!;
  const liveLater = later ? getBooking(later.id) ?? undefined : undefined;
  const cancelled = liveNext.isCancelled || liveNext.bookingStatus === "cancelled";

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Home care</p>
          <h1 className={cn("booking-display mt-1 text-[1.4rem] font-normal leading-[1.22] tracking-[-0.01em] text-foreground sm:text-[1.55rem]")}>
            Welcome back, {MOCK_CUSTOMER.firstName}
          </h1>
          <p className="mt-1 max-w-md text-[12px] text-muted-foreground sm:text-[13px]">Upcoming visits and updates.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-xl ring-1 ring-border/80 motion-safe:transition-shadow motion-safe:duration-200 hover:ring-primary/20"
          onClick={() => openDetail({ kind: "rebook", bookingId: liveNext.id })}
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Book again
        </Button>
      </div>

      <section className={cn(customerSectionClass({ priority: "hero" }), "p-5 sm:p-6 md:p-7")}>
        <p className="mb-4 text-[11px] text-muted-foreground sm:text-[12px]">Sample preview · live state</p>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className={cn(bpOverline, "text-primary/90")}>Your next visit</p>
            <button
              type="button"
              onClick={() => openDetail({ kind: "visit", bookingId: liveNext.id })}
              className="block text-left motion-safe:transition-colors hover:text-primary"
            >
              <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.22rem] font-normal tracking-tight sm:text-[1.36rem]")}>
                {liveNext.serviceLabel}
              </h2>
            </button>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {liveNext.dateLabel} · {liveNext.timeLabel} · {liveNext.areaLabel}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <button type="button" onClick={() => openDetail({ kind: "timeline", bookingId: liveNext.id })} className="motion-safe:transition-transform motion-safe:active:scale-95">
              <BookingStatusChip status={liveNext.bookingStatus} />
            </button>
            <button type="button" onClick={() => openDetail({ kind: "cleaner" })} className="motion-safe:transition-transform motion-safe:active:scale-95">
              <CleanerStatusChip status={liveNext.cleanerStatus} />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <OperationalSignalsRow items={liveNext.operationalChips} limit={3} />
        </div>

        <div className="mt-5 grid gap-5 border-t border-border/50 pt-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="min-w-0 space-y-2.5 text-[12px] text-muted-foreground">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => openDetail({ kind: "recurring", bookingId: liveNext.id })}
                className="inline-flex items-center gap-1.5 rounded-md px-1 -mx-1 motion-safe:transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                <CalendarDays className="size-3.5 shrink-0 text-primary/80" strokeWidth={1.75} aria-hidden />
                {liveNext.frequencyLabel}
                {liveNext.recurringReserved ? (
                  <span className="rounded-md border border-primary/20 bg-primary/[0.07] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Recurring
                  </span>
                ) : null}
              </button>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-primary/80" strokeWidth={1.75} aria-hidden />
                {MOCK_SAVED_ADDRESS.line}
              </span>
            </div>
            <p>
              Estimated duration · {liveNext.estimatedDurationLabel} · {liveNext.extrasSummary} ·{" "}
              {formatZar(liveNext.estimateZar)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openDetail({ kind: "cleaner" })}
            className="flex flex-col gap-2 rounded-xl bg-background/60 p-3.5 text-left ring-1 ring-border/60 backdrop-blur-sm motion-safe:transition-[box-shadow,transform] motion-safe:duration-300 motion-safe:hover:shadow-[0_12px_40px_-24px_rgba(53,99,255,0.2)] motion-safe:hover:-translate-y-px sm:max-w-[220px]"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary ring-2 ring-primary/22">
                {MOCK_ASSIGNED_CLEANER.initials}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-foreground">{MOCK_ASSIGNED_CLEANER.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {MOCK_ASSIGNED_CLEANER.rating} ★ · {MOCK_ASSIGNED_CLEANER.reviewCount} reviews
                </p>
              </div>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">{MOCK_ASSIGNED_CLEANER.tagline}</p>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-primary/85">
              View profile
              <ChevronRight className="size-3" aria-hidden />
            </span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-border/40 pt-2.5">
          {(
            [
              { label: "Reschedule", icon: CalendarDays, action: () => openDetail({ kind: "reschedule", bookingId: liveNext.id }) },
              { label: "Message support", icon: MessageCircle, action: () => navigate("messages") },
              { label: "Rebook", icon: RefreshCw, action: () => openDetail({ kind: "rebook", bookingId: liveNext.id }) },
              { label: "Cancel", icon: Ban, action: () => openDetail({ kind: "cancel", bookingId: liveNext.id }) },
            ] as const
          ).map((a, i) => (
            <span key={a.label} className="flex items-center">
              {i > 0 ? (
                <span className="mx-1.5 text-[11px] text-muted-foreground/35" aria-hidden>
                  ·
                </span>
              ) : null}
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={a.action}
                disabled={cancelled && a.label !== "Rebook" && a.label !== "Message support"}
                className="h-auto gap-1.5 px-1 py-0 text-[12px] font-medium text-foreground underline-offset-4 hover:text-primary motion-safe:transition-colors"
              >
                <a.icon className="size-3.5 text-primary/90" strokeWidth={1.75} aria-hidden />
                {a.label}
              </Button>
            </span>
          ))}
        </div>

        {liveLater ? (
          <button
            type="button"
            onClick={() => openDetail({ kind: "visit", bookingId: liveLater.id })}
            className="mt-4 block w-full rounded-xl bg-background/45 px-3.5 py-2.5 text-left ring-1 ring-border/50 motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 hover:bg-background/65 hover:shadow-sm sm:px-4"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Also scheduled</p>
            <p className="mt-0.5 text-[13px] text-foreground">
              <span className="font-medium">{liveLater.serviceLabel}</span>
              <span className="text-muted-foreground"> · </span>
              {liveLater.dateLabel}
              <span className="text-muted-foreground"> · </span>
              {liveLater.timeLabel}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <BookingStatusChip status={liveLater.bookingStatus} />
              <CleanerStatusChip status={liveLater.cleanerStatus} />
            </div>
          </button>
        ) : null}
      </section>

      <section className={customerSectionClass({ priority: "emphasis" })}>
        <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Quick actions</h2>
        <div className="mt-2.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {(
            [
              { icon: CalendarDays, label: "Reschedule", action: () => openDetail({ kind: "reschedule", bookingId: liveNext.id }) },
              { icon: MessageCircle, label: "Message support", action: () => navigate("messages") },
              { icon: RefreshCw, label: "Rebook", action: () => openDetail({ kind: "rebook", bookingId: liveNext.id }) },
              { icon: Ban, label: "Cancel visit", action: () => openDetail({ kind: "cancel", bookingId: liveNext.id }) },
            ] as const
          ).map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.action}
              className={cn(
                "snap-start rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2 text-left motion-safe:transition-[transform,box-shadow,background-color,border-color] motion-safe:duration-200 min-[400px]:min-w-0",
                "hover:border-primary/25 hover:bg-background/80 hover:shadow-sm active:scale-[0.99]",
                "flex min-w-[42%] shrink-0 items-center gap-2 sm:min-w-0 sm:flex-1",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <a.icon className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="text-[13px] font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={customerSectionClass({ priority: "default" })} aria-labelledby="dash-visit-progress">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 id="dash-visit-progress" className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>
              Visit status
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Live progress updates</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-lg text-muted-foreground"
            onClick={() => advanceBookingStatus(liveNext.id)}
            disabled={cancelled || liveNext.bookingStatus === "completed"}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Advance
          </Button>
        </div>
        <button
          type="button"
          onClick={() => openDetail({ kind: "timeline", bookingId: liveNext.id })}
          className="mt-3 block w-full rounded-xl bg-muted/25 px-3 py-3.5 text-left ring-1 ring-border/55 motion-safe:transition-[box-shadow,background-color] motion-safe:duration-200 hover:bg-muted/40 hover:shadow-sm sm:px-4 sm:py-4"
        >
          <CustomerBookingTimeline booking={liveNext} />
          <p className="mt-2 text-right text-[11px] font-semibold text-primary/80">
            Tap to view step detail
          </p>
        </button>
      </section>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Recent stays</h2>
          <button
            type="button"
            onClick={() => navigate("visits")}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary motion-safe:transition-colors hover:text-primary/85"
          >
            View all
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
        <ul className="mt-2.5 space-y-2">
          {previewPast.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/[0.2] px-3 py-2.5 motion-safe:transition-[box-shadow,transform,border-color] motion-safe:duration-200 hover:-translate-y-px hover:border-primary/15 hover:shadow-md"
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
                {b.ratingPlaceholder ? (
                  <p className="mt-0.5 text-[11px] font-medium text-primary">{b.ratingPlaceholder}</p>
                ) : null}
              </button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 shrink-0 rounded-lg text-[12px]"
                onClick={() => openDetail({ kind: "rebookPast", pastId: b.id })}
              >
                <RefreshCw className="size-3" aria-hidden />
                Rebook
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
