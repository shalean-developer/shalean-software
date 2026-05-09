"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Repeat2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatZar } from "@/components/booking-prototype/mock-pricing";
import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { BookingStatusChip, CleanerStatusChip } from "./dashboard-status-chip";
import { CustomerBookingTimeline } from "./customer-booking-timeline";
import {
  useCustomerWorkflow,
  type CustomerDetailTarget,
} from "./customer-workflow-context";
import {
  BOOKING_LIFECYCLE_LABEL,
  BOOKING_LIFECYCLE_ORDER,
  MOCK_ASSIGNED_CLEANER,
  MOCK_PAST,
  MOCK_PAYMENT,
  MOCK_SAVED_ADDRESS,
  type BookingStatusId,
} from "./mock-customer-data";

const RESCHEDULE_OPTIONS = [
  { date: "Sat 17 May", time: "Morning · 09:00" },
  { date: "Mon 19 May", time: "Afternoon · 14:00" },
  { date: "Thu 22 May", time: "Morning · 08:30" },
] as const;

function VisitDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const {
    getBooking,
    advanceBookingStatus,
    setBookingStatus,
    openDetail,
    restoreBooking,
    navigate,
  } = useCustomerWorkflow();

  const b = getBooking(bookingId);
  if (!b) return <p className="text-[13px] text-muted-foreground">Visit not found.</p>;

  const status = b.bookingStatus;
  const cancelled = b.isCancelled || status === "cancelled";

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Visit detail</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {b.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {b.dateLabel} · {b.timeLabel} · {b.areaLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <BookingStatusChip status={status} />
        <CleanerStatusChip status={b.cleanerStatus} />
        {b.recurringReserved ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Repeat2 className="size-3" strokeWidth={1.85} aria-hidden />
            {b.frequencyLabel}
          </span>
        ) : null}
      </div>

      <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/55">
        <CustomerBookingTimeline booking={{ ...b, bookingStatus: status }} />
      </div>

      <dl className="grid gap-2 text-[12.5px] text-muted-foreground sm:grid-cols-2">
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Estimate</dt>
          <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
            {formatZar(b.estimateZar)}
          </dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Duration</dt>
          <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
            {b.estimatedDurationLabel}
          </dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60 sm:col-span-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Extras</dt>
          <dd className="mt-0.5 text-[13px] font-medium text-foreground">{b.extrasSummary}</dd>
        </div>
      </dl>

      <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/55">
        <div className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary/80" strokeWidth={1.65} aria-hidden />
          <p>
            <span className="text-foreground">{MOCK_SAVED_ADDRESS.line}</span>
            <br />
            <span>{b.arrivalConfidence}</span>
          </p>
        </div>
      </div>

      {!cancelled ? (
        <div className="flex flex-wrap gap-1.5">
          {BOOKING_LIFECYCLE_ORDER.map((s) => {
            const on = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setBookingStatus(bookingId, s)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide ring-1 motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.97]",
                  on
                    ? "bg-primary/[0.1] text-primary ring-primary/35"
                    : "bg-muted/30 text-muted-foreground ring-border/70 hover:bg-muted/55 hover:text-foreground",
                )}
              >
                {on ? <CheckCircle2 className="size-3" strokeWidth={2.2} aria-hidden /> : null}
                {BOOKING_LIFECYCLE_LABEL[s]}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {!cancelled ? (
          <>
            <Button
              type="button"
              className="touch-manipulation rounded-xl"
              onClick={() => advanceBookingStatus(bookingId)}
            >
              <Sparkles className="size-4" aria-hidden />
              Advance lifecycle
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="touch-manipulation rounded-xl"
              onClick={() => openDetail({ kind: "reschedule", bookingId })}
            >
              <CalendarClock className="size-4" aria-hidden />
              Reschedule
            </Button>
            <Button
              type="button"
              variant="outline"
              className="touch-manipulation rounded-xl"
              onClick={() => {
                navigate("messages");
                onClose();
              }}
            >
              <MessageCircle className="size-4" aria-hidden />
              Message support
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="touch-manipulation rounded-xl text-muted-foreground"
              onClick={() => openDetail({ kind: "cancel", bookingId })}
            >
              <Ban className="size-4" aria-hidden />
              Cancel visit
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              className="touch-manipulation rounded-xl"
              onClick={() => {
                restoreBooking(bookingId);
              }}
            >
              <RefreshCw className="size-4" aria-hidden />
              Restore visit
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="touch-manipulation rounded-xl text-muted-foreground"
              onClick={onClose}
            >
              Close
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function CleanerProfileDetail({ onClose }: { onClose: () => void }) {
  const { navigate, pushToast, openThread } = useCustomerWorkflow();
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Your cleaner</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {MOCK_ASSIGNED_CLEANER.name}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{MOCK_ASSIGNED_CLEANER.tagline}</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-muted/30 p-3 ring-1 ring-border/55">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/[0.14] text-[15px] font-semibold tracking-tight text-primary">
          {MOCK_ASSIGNED_CLEANER.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-foreground">
            {MOCK_ASSIGNED_CLEANER.rating} ★ · {MOCK_ASSIGNED_CLEANER.reviewCount} reviews
          </p>
          <p className="text-[11.5px] text-muted-foreground">{MOCK_ASSIGNED_CLEANER.relationshipLabel}</p>
          <p className="text-[11.5px] text-muted-foreground">{MOCK_ASSIGNED_CLEANER.availableAgainLabel}</p>
        </div>
      </div>
      <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary/75" strokeWidth={1.85} aria-hidden />
          {MOCK_ASSIGNED_CLEANER.visitsWithYou} previous visits with you.
        </li>
        <li className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary/75" strokeWidth={1.85} aria-hidden />
          Trusted with your kitchen-first preference.
        </li>
        <li className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary/75" strokeWidth={1.85} aria-hidden />
          Familiar with the side gate code.
        </li>
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            openThread("th_cleaner");
            navigate("messages");
            onClose();
          }}
        >
          <MessageCircle className="size-4" aria-hidden />
          Message Thandi
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() =>
            pushToast({
              tone: "info",
              title: "Calling Thandi",
              body: "Dialler opens in the live app.",
            })
          }
        >
          <Phone className="size-4" aria-hidden />
          Call cleaner
        </Button>
      </div>
    </div>
  );
}

function TimelineDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { getBooking, advanceBookingStatus } = useCustomerWorkflow();
  const b = getBooking(bookingId);
  if (!b) return <p className="text-[13px] text-muted-foreground">Visit not found.</p>;
  const status = b.bookingStatus;

  const STEP_DESCRIPTION: Record<BookingStatusId, string> = {
    requested: "We received your request and are reviewing the slot.",
    confirmed: "Your slot is locked and the team is queued.",
    matching_cleaner: "Dispatch is pairing the right cleaner for your visit.",
    assigned: "Your cleaner has been paired with this visit.",
    en_route: "Your cleaner is on the way — we're holding your arrival window.",
    arrived: "Your cleaner has arrived on site and is unpacking the kit.",
    in_progress: "Cleaner is on site working through the checklist.",
    completed: "Visit done — receipt is on its way.",
    cancelled: "This visit was cancelled.",
  };

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Visit progress</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {BOOKING_LIFECYCLE_LABEL[status]}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{STEP_DESCRIPTION[status]}</p>
      </div>
      <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/55">
        <CustomerBookingTimeline booking={b} />
      </div>
      <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
        {BOOKING_LIFECYCLE_ORDER.map((s) => {
          const order = BOOKING_LIFECYCLE_ORDER.indexOf(s);
          const curOrder = BOOKING_LIFECYCLE_ORDER.indexOf(status);
          const done = order < curOrder;
          const here = order === curOrder;
          return (
            <li
              key={s}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5",
                here && "bg-primary/[0.07] text-foreground ring-1 ring-primary/20",
                done && "text-foreground/75",
              )}
            >
              {done ? (
                <CheckCircle2 className="size-3.5 text-primary/75" strokeWidth={2.2} aria-hidden />
              ) : here ? (
                <span className="size-2 rounded-full bg-primary motion-safe:animate-pulse motion-reduce:animate-none" aria-hidden />
              ) : (
                <span className="size-2 rounded-full bg-muted-foreground/30" aria-hidden />
              )}
              <span className="text-[12.5px]">{BOOKING_LIFECYCLE_LABEL[s]}</span>
            </li>
          );
        })}
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" className="touch-manipulation rounded-xl" onClick={() => advanceBookingStatus(bookingId)}>
          Advance step
        </Button>
        <Button type="button" variant="ghost" className="touch-manipulation rounded-xl text-muted-foreground" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function RecurringDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { getBooking, pushToast, navigate } = useCustomerWorkflow();
  const b = getBooking(bookingId);
  if (!b) return <p className="text-[13px] text-muted-foreground">Visit not found.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Recurring</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {b.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {b.areaLabel} · {b.frequencyLabel}
        </p>
      </div>
      <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/55">
        <p className="text-[12.5px] text-muted-foreground">{b.continuityLine}</p>
        <p className="mt-2 text-[12px] text-muted-foreground">{b.rebookHint}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            pushToast({
              tone: "primary",
              title: "Recurring confirmed",
              body: `${b.frequencyLabel} cadence held.`,
            });
            onClose();
          }}
        >
          Hold cadence
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            navigate("preferences");
            onClose();
          }}
        >
          Adjust preferences
        </Button>
      </div>
    </div>
  );
}

function RescheduleDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { getBooking, rescheduleBooking } = useCustomerWorkflow();
  const b = getBooking(bookingId);
  const [pick, setPick] = useState(0);
  if (!b) return <p className="text-[13px] text-muted-foreground">Visit not found.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Reschedule</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {b.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Currently {b.dateLabel} · {b.timeLabel}
        </p>
      </div>
      <div className="space-y-2">
        {RESCHEDULE_OPTIONS.map((opt, i) => {
          const on = pick === i;
          return (
            <button
              key={opt.date}
              type="button"
              onClick={() => setPick(i)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left ring-1 motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.99]",
                on
                  ? "bg-primary/[0.08] text-foreground ring-primary/30"
                  : "bg-muted/30 text-muted-foreground ring-border/70 hover:bg-muted/55 hover:text-foreground",
              )}
            >
              <div>
                <p className="text-[13.5px] font-semibold text-foreground">{opt.date}</p>
                <p className="text-[12px] text-muted-foreground">{opt.time}</p>
              </div>
              {on ? (
                <CheckCircle2 className="size-4 text-primary" strokeWidth={2.2} aria-hidden />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground/70" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            const choice = RESCHEDULE_OPTIONS[pick]!;
            rescheduleBooking(bookingId, choice.date, choice.time);
            onClose();
          }}
        >
          Confirm new time
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={onClose}
        >
          Keep current
        </Button>
      </div>
    </div>
  );
}

function CancelDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { getBooking, cancelBooking } = useCustomerWorkflow();
  const b = getBooking(bookingId);
  if (!b) return <p className="text-[13px] text-muted-foreground">Visit not found.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Cancel visit</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {b.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {b.dateLabel} · {b.timeLabel}
        </p>
      </div>
      <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-[12.5px] text-foreground ring-1 ring-amber-500/30">
        We’ll refund the full amount to your default card and notify your cleaner.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="destructive"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            cancelBooking(bookingId);
            onClose();
          }}
        >
          <Ban className="size-4" aria-hidden />
          Yes, cancel
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={onClose}
        >
          Keep visit
        </Button>
      </div>
    </div>
  );
}

function RebookDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { getBooking, rebookFromVisit } = useCustomerWorkflow();
  const b = getBooking(bookingId);
  if (!b) return <p className="text-[13px] text-muted-foreground">Visit not found.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Rebook</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {b.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {b.areaLabel} · {b.frequencyLabel}
        </p>
      </div>
      <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/55">
        <p className="text-[12.5px] text-muted-foreground">{b.rebookHint}</p>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Estimate · <span className="font-semibold text-foreground">{formatZar(b.estimateZar)}</span>
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            rebookFromVisit(bookingId);
            onClose();
          }}
        >
          Confirm rebook
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={onClose}
        >
          Maybe later
        </Button>
      </div>
    </div>
  );
}

function RebookPastDetail({ pastId, onClose }: { pastId: string; onClose: () => void }) {
  const { rebookFromPast } = useCustomerWorkflow();
  const past = MOCK_PAST.find((p) => p.id === pastId);
  if (!past) return <p className="text-[13px] text-muted-foreground">Visit not found.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Rebook</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {past.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Last cleaned {past.dateLabel} · {past.areaLabel}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            rebookFromPast(past.id);
            onClose();
          }}
        >
          <RefreshCw className="size-4" aria-hidden />
          Rebook same setup
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

function InvoiceDetail({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const { pushToast } = useCustomerWorkflow();
  const inv = MOCK_PAYMENT.invoices.find((i) => i.id === invoiceId);
  if (!inv) return <p className="text-[13px] text-muted-foreground">Receipt not found.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Receipt</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {inv.label}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {inv.serviceLine} · {inv.periodLabel}
        </p>
      </div>
      <dl className="grid gap-2 text-[12.5px] text-muted-foreground sm:grid-cols-2">
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Total</dt>
          <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
            {formatZar(inv.amountZar)}
          </dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Status</dt>
          <dd className="mt-0.5 text-[14px] font-semibold text-emerald-600">{inv.status}</dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60 sm:col-span-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Notes</dt>
          <dd className="mt-0.5 text-[13px] text-foreground">{inv.folioNote}</dd>
        </div>
      </dl>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            pushToast({
              tone: "info",
              title: "PDF emailed",
              body: "Statement sent to your registered email.",
            });
            onClose();
          }}
        >
          <Download className="size-4" aria-hidden />
          Email PDF
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

function AddCardDetail({ onClose }: { onClose: () => void }) {
  const { addCard } = useCustomerWorkflow();
  const [last4, setLast4] = useState("");

  const valid = /^\d{4}$/.test(last4);

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>New card</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          Add a payment method
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Mock-only — no real card data is captured.
        </p>
      </div>
      <label className="block">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
          Last 4 digits
        </span>
        <input
          inputMode="numeric"
          maxLength={4}
          value={last4}
          onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="4242"
          className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-[14px] outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </label>
      <p className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2 text-[11.5px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary/85" strokeWidth={1.85} aria-hidden />
        Demo card · stored locally for this prototype only.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          disabled={!valid}
          onClick={() => {
            addCard(`Visa ···${last4}`);
            onClose();
          }}
        >
          <CreditCard className="size-4" aria-hidden />
          Save card
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

function detailHeader(target: CustomerDetailTarget) {
  switch (target.kind) {
    case "visit":
      return { icon: CalendarDays, label: "Visit" };
    case "cleaner":
      return { icon: Sparkles, label: "Cleaner" };
    case "timeline":
      return { icon: CalendarClock, label: "Progress" };
    case "recurring":
      return { icon: Repeat2, label: "Recurring" };
    case "reschedule":
      return { icon: CalendarClock, label: "Reschedule" };
    case "cancel":
      return { icon: Ban, label: "Cancel" };
    case "rebook":
    case "rebookPast":
      return { icon: RefreshCw, label: "Rebook" };
    case "invoice":
      return { icon: FileText, label: "Receipt" };
    case "addCard":
      return { icon: CreditCard, label: "New card" };
  }
}

export function CustomerDetailSheet() {
  const { detailTarget, closeDetail } = useCustomerWorkflow();
  const open = detailTarget !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, closeDetail]);

  if (!open || !detailTarget) return null;

  const header = detailHeader(detailTarget);

  let body: React.ReactNode = null;
  if (detailTarget.kind === "visit") body = <VisitDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "cleaner") body = <CleanerProfileDetail onClose={closeDetail} />;
  else if (detailTarget.kind === "timeline") body = <TimelineDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "recurring") body = <RecurringDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "reschedule") body = <RescheduleDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "cancel") body = <CancelDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "rebook") body = <RebookDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "rebookPast") body = <RebookPastDetail pastId={detailTarget.pastId} onClose={closeDetail} />;
  else if (detailTarget.kind === "invoice") body = <InvoiceDetail invoiceId={detailTarget.invoiceId} onClose={closeDetail} />;
  else if (detailTarget.kind === "addCard") body = <AddCardDetail onClose={closeDetail} />;

  const Icon = header.icon;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close detail"
        onClick={closeDetail}
        className="absolute inset-0 cursor-default bg-foreground/35 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none"
      />
      <div
        className={cn(
          "relative z-[71] flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-background/98 p-5 shadow-[0_-18px_60px_-30px_rgba(15,23,48,0.45)] backdrop-blur-xl sm:max-w-md sm:rounded-3xl sm:p-6",
          "motion-safe:animate-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-300 motion-safe:ease-out motion-reduce:animate-none",
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/20">
            <Icon className="size-3" strokeWidth={1.85} aria-hidden />
            {header.label}
          </span>
          <button
            type="button"
            onClick={closeDetail}
            aria-label="Close"
            className="inline-flex size-9 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-muted/45 hover:text-foreground active:scale-[0.97]"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">{body}</div>
      </div>
    </div>
  );
}
