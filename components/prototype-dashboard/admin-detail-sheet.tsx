"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock4,
  CreditCard,
  Headphones,
  MapPin,
  MessageCircle,
  Pencil,
  Radar,
  Repeat2,
  Send,
  Sparkles,
  Star,
  TrendingUp,
  UserSquare2,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatZar } from "@/components/booking-prototype/mock-pricing";
import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { adminChipClass } from "./admin-dashboard-ui";
import {
  useAdminWorkflow,
  type AdminDetailTarget,
} from "./admin-workflow-context";
import {
  ADMIN_ALERTS,
  ADMIN_BOOKING_LIFECYCLE_ORDER,
  ADMIN_BOOKING_STATUS_LABEL,
  ADMIN_CLEANER_STATUS_LABEL,
  ADMIN_CUSTOMERS,
  ADMIN_DISPATCH_LABEL,
  ADMIN_DISPATCH_SUGGESTIONS,
  ADMIN_PAYOUT_LABEL,
  ADMIN_PRICING_CONTROLS,
  type AdminCleanerStatus,
} from "./mock-admin-data";

const RESCHEDULE_OPTIONS = [
  { date: "Today", time: "16:30" },
  { date: "Tomorrow", time: "08:30" },
  { date: "Sun 10", time: "10:00" },
  { date: "Mon 11", time: "13:00" },
] as const;

/* --------------------------------- Booking -------------------------------- */

function BookingDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const {
    state,
    setBookingStatus,
    advanceBookingStatus,
    openDetail,
    navigate,
    pushToast,
  } = useAdminWorkflow();
  const b = state.bookings[bookingId];
  if (!b) return <p className="text-[13px] text-muted-foreground">Booking not found.</p>;

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Booking · {b.ref}</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {b.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {b.dateLabel} · {b.timeLabel} · {b.area}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={adminChipClass("info")}>{ADMIN_BOOKING_STATUS_LABEL[b.status]}</span>
        {b.recurring ? (
          <span className={adminChipClass("info")}>
            <Repeat2 className="size-3" aria-hidden />
            Recurring
          </span>
        ) : null}
      </div>

      <dl className="grid gap-2 text-[12.5px] text-muted-foreground sm:grid-cols-2">
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Customer</dt>
          <dd className="mt-0.5 text-[14px] font-semibold text-foreground">{b.customerName}</dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Estimate</dt>
          <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
            {formatZar(b.estimateZar)}
          </dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Estimated duration</dt>
          <dd className="mt-0.5 text-[13px] font-medium text-foreground">{b.durationLabel}</dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Address</dt>
          <dd className="mt-0.5 text-[13px] text-foreground">{b.addressLine}</dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60 sm:col-span-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Cleaner</dt>
          <dd className="mt-0.5 text-[13px] font-semibold text-foreground">
            {b.cleanerName ?? <span className="text-amber-600 dark:text-amber-300">Unassigned</span>}
          </dd>
        </div>
      </dl>

      {b.riskFlags && b.riskFlags.length > 0 ? (
        <div className="rounded-xl bg-rose-500/[0.07] px-3 py-2 text-[12.5px] text-rose-600 ring-1 ring-rose-500/30 dark:text-rose-300">
          {b.riskFlags.join(" · ")}
        </div>
      ) : null}

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/85">Lifecycle</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ADMIN_BOOKING_LIFECYCLE_ORDER.map((s) => {
            const on = b.status === s;
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
                {ADMIN_BOOKING_STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
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
          onClick={() => openDetail({ kind: "reassign", bookingId })}
        >
          <Users className="size-4" aria-hidden />
          Reassign cleaner
        </Button>
        <Button
          type="button"
          variant="outline"
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
          onClick={() => openDetail({ kind: "customer", customerName: b.customerName })}
        >
          <UserSquare2 className="size-4" aria-hidden />
          Customer profile
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            navigate("messages");
            onClose();
            pushToast({ tone: "info", title: "Routing to messages", body: `Open ${b.customerName}'s thread.` });
          }}
        >
          <MessageCircle className="size-4" aria-hidden />
          Message customer
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={() => openDetail({ kind: "cancel", bookingId })}
        >
          <Ban className="size-4" aria-hidden />
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------- Reassign -------------------------------- */

function ReassignDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { state, reassignBooking } = useAdminWorkflow();
  const b = state.bookings[bookingId];
  const [pickId, setPickId] = useState<string>(ADMIN_DISPATCH_SUGGESTIONS[0]?.cleanerId ?? "");
  if (!b) return <p className="text-[13px] text-muted-foreground">Booking not found.</p>;

  const candidates = ADMIN_DISPATCH_SUGGESTIONS.map((s) => {
    const c = state.cleaners[s.cleanerId];
    if (!c) return null;
    return { ...s, status: c.status, rating: c.rating, name: c.name, initials: c.initials };
  }).filter(Boolean) as Array<{
    cleanerId: string;
    cleanerName: string;
    initials: string;
    note: string;
    distanceLabel: string;
    status: AdminCleanerStatus;
    rating: number;
    name: string;
  }>;

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Reassign cleaner</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {b.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {b.ref} · {b.dateLabel} · {b.timeLabel} · {b.area}
        </p>
      </div>
      <div className="space-y-2">
        {candidates.map((c) => {
          const on = pickId === c.cleanerId;
          return (
            <button
              key={c.cleanerId}
              type="button"
              onClick={() => setPickId(c.cleanerId)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ring-1 motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.99]",
                on
                  ? "bg-primary/[0.08] ring-primary/30"
                  : "bg-muted/25 ring-border/70 hover:bg-muted/50",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-[12px] font-semibold text-primary">
                {c.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-foreground">{c.name}</p>
                <p className="text-[11.5px] text-muted-foreground">{c.note}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {c.distanceLabel} · {ADMIN_CLEANER_STATUS_LABEL[c.status]}
                </p>
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
          disabled={!pickId}
          onClick={() => {
            reassignBooking(bookingId, pickId);
            onClose();
          }}
        >
          <Users className="size-4" aria-hidden />
          Confirm reassign
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={onClose}
        >
          Keep cleaner
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- Reschedule ------------------------------- */

function RescheduleDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { state, rescheduleBooking } = useAdminWorkflow();
  const b = state.bookings[bookingId];
  const [pick, setPick] = useState(0);
  if (!b) return <p className="text-[13px] text-muted-foreground">Booking not found.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Reschedule</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {b.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {b.ref} · currently {b.dateLabel} · {b.timeLabel}
        </p>
      </div>
      <div className="space-y-2">
        {RESCHEDULE_OPTIONS.map((opt, i) => {
          const on = pick === i;
          return (
            <button
              key={`${opt.date}-${opt.time}`}
              type="button"
              onClick={() => setPick(i)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left ring-1 motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.99]",
                on
                  ? "bg-primary/[0.08] ring-primary/30"
                  : "bg-muted/25 ring-border/70 hover:bg-muted/50",
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

/* --------------------------------- Cancel --------------------------------- */

function CancelDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { state, cancelBooking } = useAdminWorkflow();
  const b = state.bookings[bookingId];
  if (!b) return <p className="text-[13px] text-muted-foreground">Booking not found.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Cancel booking</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {b.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {b.ref} · {b.dateLabel} · {b.timeLabel}
        </p>
      </div>
      <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-[12.5px] text-foreground ring-1 ring-amber-500/30">
        Customer will receive a refund and the cleaner will be notified.
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
          Cancel booking
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={onClose}
        >
          Keep booking
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- Cleaner -------------------------------- */

const CLEANER_STATUS_OPTIONS: AdminCleanerStatus[] = [
  "available",
  "assigned",
  "en_route",
  "in_visit",
  "paused",
  "offline",
];

function CleanerProfile({ cleanerId, onClose }: { cleanerId: string; onClose: () => void }) {
  const { state, setCleanerStatus, navigate, pushToast } = useAdminWorkflow();
  const c = state.cleaners[cleanerId];
  if (!c) return <p className="text-[13px] text-muted-foreground">Cleaner not found.</p>;
  const assignments = Object.values(state.bookings).filter((b) => b.cleanerName === c.name);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-[15px] font-semibold text-primary ring-2 ring-primary/20">
          {c.initials}
        </span>
        <div className="min-w-0">
          <p className={cn(bpOverline, "text-primary/85")}>Cleaner</p>
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.2rem] font-normal sm:text-[1.32rem]")}>
            {c.name}
          </h2>
          <p className="text-[12.5px] text-muted-foreground">
            {c.area} · {c.lastSeenLabel}
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Rating</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[14px] font-semibold tabular-nums text-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
            {c.rating.toFixed(2)}
          </p>
          <p className="text-[10.5px] text-muted-foreground">{c.reviewCount} reviews</p>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Completion</p>
          <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">{c.completionRate}%</p>
          <p className="text-[10.5px] text-muted-foreground">all-time</p>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Today</p>
          <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
            {c.visitsToday} · {c.hoursToday}h
          </p>
          <p className="text-[10.5px] text-muted-foreground">{formatZar(c.earningsTodayZar)}</p>
        </div>
      </div>
      {c.badges && c.badges.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {c.badges.map((b) => (
            <span key={b} className={adminChipClass("info", "px-2 py-0.5 text-[10px]")}>{b}</span>
          ))}
        </div>
      ) : null}

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/85">Status</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CLEANER_STATUS_OPTIONS.map((s) => {
            const on = c.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setCleanerStatus(cleanerId, s)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide ring-1 motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.97]",
                  on
                    ? "bg-primary/[0.1] text-primary ring-primary/35"
                    : "bg-muted/30 text-muted-foreground ring-border/70 hover:bg-muted/55 hover:text-foreground",
                )}
              >
                {on ? <CheckCircle2 className="size-3" strokeWidth={2.2} aria-hidden /> : null}
                {ADMIN_CLEANER_STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/85">Assignments</p>
        {assignments.length === 0 ? (
          <p className="mt-2 rounded-xl bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
            No bookings assigned right now.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {assignments.slice(0, 4).map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-xl bg-muted/25 px-3 py-2 text-[12px] ring-1 ring-border/55"
              >
                <span className="min-w-0 truncate text-foreground">
                  {b.ref} · {b.serviceLabel}
                </span>
                <span className="text-muted-foreground">{b.timeLabel}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            navigate("messages");
            onClose();
            pushToast({ tone: "info", title: "Routing", body: `Cleaner desk · ${c.name}` });
          }}
        >
          <MessageCircle className="size-4" aria-hidden />
          Message cleaner
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() =>
            pushToast({
              tone: "info",
              title: "Day plan opened",
              body: `${c.visitsToday} visits across ${c.area}`,
            })
          }
        >
          <CalendarDays className="size-4" aria-hidden />
          View day plan
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- Customer ------------------------------- */

function CustomerProfile({ customerName, onClose }: { customerName: string; onClose: () => void }) {
  const { state, openDetail, navigate, pushToast } = useAdminWorkflow();
  const customer =
    ADMIN_CUSTOMERS.find((c) => c.name === customerName) ??
    ({
      id: "guest",
      name: customerName,
      initials: customerName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      area: "—",
      bookingsCount: 0,
      lastVisitLabel: "—",
      lifetimeZar: 0,
      flags: [],
    } as (typeof ADMIN_CUSTOMERS)[number]);

  const recentBookings = Object.values(state.bookings).filter((b) => b.customerName === customerName);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-[15px] font-semibold text-primary ring-2 ring-primary/20">
          {customer.initials}
        </span>
        <div>
          <p className={cn(bpOverline, "text-primary/85")}>Customer</p>
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.2rem] font-normal sm:text-[1.32rem]")}>
            {customer.name}
          </h2>
          <p className="text-[12.5px] text-muted-foreground">{customer.area}</p>
        </div>
      </div>

      <dl className="grid gap-2 text-[12.5px] text-muted-foreground sm:grid-cols-3">
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Bookings</dt>
          <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">{customer.bookingsCount}</dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Last visit</dt>
          <dd className="mt-0.5 text-[14px] font-semibold text-foreground">{customer.lastVisitLabel}</dd>
        </div>
        <div className="rounded-xl bg-card/80 px-3 py-2.5 ring-1 ring-border/60">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">Lifetime</dt>
          <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
            {formatZar(customer.lifetimeZar)}
          </dd>
        </div>
      </dl>

      {customer.flags && customer.flags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {customer.flags.map((f) => (
            <span key={f} className={adminChipClass("active", "px-2 py-0.5 text-[10px]")}>{f}</span>
          ))}
        </div>
      ) : null}

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/85">Recent bookings</p>
        {recentBookings.length === 0 ? (
          <p className="mt-2 rounded-xl bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
            No bookings yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {recentBookings.slice(0, 5).map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => openDetail({ kind: "booking", bookingId: b.id })}
                  className="flex w-full items-center justify-between rounded-xl bg-muted/25 px-3 py-2 text-[12px] ring-1 ring-border/55 hover:bg-muted/45"
                >
                  <span className="min-w-0 truncate text-foreground">
                    {b.ref} · {b.serviceLabel}
                  </span>
                  <span className="text-muted-foreground">
                    {b.dateLabel} · {b.timeLabel}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            openDetail({ kind: "createBooking" });
          }}
        >
          <Sparkles className="size-4" aria-hidden />
          Create booking
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            navigate("messages");
            onClose();
            pushToast({ tone: "info", title: "Routing", body: `Open ${customer.name}'s thread.` });
          }}
        >
          <MessageCircle className="size-4" aria-hidden />
          Open support
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() =>
            pushToast({
              tone: "success",
              title: "Invoice resent",
              body: `${customer.name} · last receipt re-emailed.`,
            })
          }
        >
          <CreditCard className="size-4" aria-hidden />
          Resend invoice
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground"
          onClick={() =>
            pushToast({
              tone: "info",
              title: "Preferences updated",
              body: `${customer.name} · saved.`,
            })
          }
        >
          <Pencil className="size-4" aria-hidden />
          Update preferences
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------------- Slot --------------------------------- */

function SlotDetail({ slotId, onClose }: { slotId: string; onClose: () => void }) {
  const { state, assignSlot, setSlotState, markLate, pushToast } = useAdminWorkflow();
  const slot = state.slots[slotId];
  const [pickId, setPickId] = useState<string>(ADMIN_DISPATCH_SUGGESTIONS[0]?.cleanerId ?? "");
  if (!slot) return <p className="text-[13px] text-muted-foreground">Slot not found.</p>;

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Dispatch slot · {slot.bookingRef}</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {slot.serviceLabel}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {slot.timeLabel} · {slot.durationLabel} · {slot.area}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={adminChipClass("info")}>{ADMIN_DISPATCH_LABEL[slot.state]}</span>
        {slot.cleanerName ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border/55">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[9.5px] font-semibold text-primary">
              {slot.cleanerInitials}
            </span>
            {slot.cleanerName}
          </span>
        ) : null}
      </div>

      {slot.riskFlags && slot.riskFlags.length > 0 ? (
        <div className="rounded-xl bg-rose-500/[0.07] px-3 py-2 text-[12.5px] text-rose-600 ring-1 ring-rose-500/30 dark:text-rose-300">
          {slot.riskFlags.join(" · ")}
        </div>
      ) : null}

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/85">
          Suggested matches
        </p>
        <div className="mt-2 space-y-2">
          {ADMIN_DISPATCH_SUGGESTIONS.map((s) => {
            const on = pickId === s.cleanerId;
            const c = state.cleaners[s.cleanerId];
            return (
              <button
                key={s.cleanerId}
                type="button"
                onClick={() => setPickId(s.cleanerId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.99]",
                  on
                    ? "bg-primary/[0.08] ring-primary/30"
                    : "bg-muted/25 ring-border/70 hover:bg-muted/45",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-[12px] font-semibold text-primary">
                  {s.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{s.cleanerName}</p>
                  <p className="text-[11.5px] text-muted-foreground">{s.note}</p>
                  {c ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {s.distanceLabel} · {ADMIN_CLEANER_STATUS_LABEL[c.status]}
                    </p>
                  ) : null}
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
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          disabled={!pickId}
          onClick={() => {
            assignSlot(slotId, pickId);
            onClose();
          }}
        >
          <Users className="size-4" aria-hidden />
          {slot.cleanerName ? "Reassign cleaner" : "Match cleaner"}
        </Button>
        {slot.state === "conflict" ? (
          <Button
            type="button"
            variant="secondary"
            className="touch-manipulation rounded-xl"
            onClick={() => {
              setSlotState(slotId, "matched");
              pushToast({ tone: "success", title: "Conflict resolved", body: slot.bookingRef });
              onClose();
            }}
          >
            <Sparkles className="size-4" aria-hidden />
            Resolve conflict
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="touch-manipulation rounded-xl"
            onClick={() => {
              markLate(slotId);
              onClose();
            }}
          >
            <Clock4 className="size-4" aria-hidden />
            Mark late arrival
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="touch-manipulation rounded-xl text-muted-foreground sm:col-span-2"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- Support -------------------------------- */

function SupportThreadDetail({ threadId, onClose }: { threadId: string; onClose: () => void }) {
  const { state, sendThreadReply, escalateThread, resolveThread, openDetail, pushToast } = useAdminWorkflow();
  const t = state.threads[threadId];
  const [draft, setDraft] = useState("");
  if (!t) return <p className="text-[13px] text-muted-foreground">Thread not found.</p>;

  const send = () => {
    if (!draft.trim()) return;
    sendThreadReply(threadId, draft.trim());
    setDraft("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-[14px] font-semibold text-primary">
          {t.initials}
        </span>
        <div className="min-w-0">
          <p className={cn(bpOverline, "text-primary/85")}>Support thread</p>
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.2rem] font-normal sm:text-[1.32rem]")}>
            {t.subject}
          </h2>
          <p className="text-[12.5px] text-muted-foreground">
            {t.customerName} · {t.channel}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={adminChipClass(t.priority === "high" || t.escalated ? "alert" : t.priority === "med" ? "warn" : "muted")}>
          {t.escalated ? "Escalated" : t.priority === "high" ? "High priority" : t.priority === "med" ? "Standard" : "Low"}
        </span>
        {t.resolved ? <span className={adminChipClass("success")}>Resolved</span> : null}
      </div>

      <div className="max-h-[40vh] space-y-2 overflow-y-auto rounded-2xl bg-muted/30 p-3 ring-1 ring-border/55">
        {t.messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex w-full",
              m.authorRole === "ops" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug ring-1",
                m.authorRole === "ops"
                  ? "bg-primary/[0.1] text-foreground ring-primary/25"
                  : "bg-background text-foreground ring-border/55",
              )}
            >
              <p>{m.body}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{m.timeLabel}</p>
            </div>
          </div>
        ))}
        {state.typingThreadId === threadId ? (
          <div className="flex justify-start">
            <span className="rounded-2xl bg-background px-3 py-2 text-[12px] text-muted-foreground ring-1 ring-border/55">
              <span className="motion-safe:animate-pulse">{t.customerName} is typing…</span>
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Reply to customer…"
          className="h-10 flex-1 rounded-xl border border-border/70 bg-background px-3 text-[13px] outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
        />
        <Button type="button" onClick={send} disabled={!draft.trim()} className="touch-manipulation rounded-xl">
          <Send className="size-4" aria-hidden />
          Send
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["Looking into it now.", "ETA shared with customer.", "Updated booking — confirming on email."] as const).map((quick) => (
          <button
            key={quick}
            type="button"
            onClick={() => sendThreadReply(threadId, quick)}
            className="rounded-full bg-muted/30 px-3 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/55 hover:ring-primary/25"
          >
            {quick}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() => escalateThread(threadId)}
          disabled={t.escalated}
        >
          <AlertOctagon className="size-4" aria-hidden />
          Escalate
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            const matchingBooking = Object.values(state.bookings).find((b) => b.customerName === t.customerName);
            if (matchingBooking) {
              openDetail({ kind: "reschedule", bookingId: matchingBooking.id });
            } else {
              pushToast({ tone: "info", title: "No active booking", body: `Open ${t.customerName}'s profile to add one.` });
            }
          }}
        >
          <CalendarClock className="size-4" aria-hidden />
          Reschedule
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() =>
            pushToast({ tone: "info", title: "Note saved", body: `${t.subject} · internal note added.` })
          }
        >
          <Pencil className="size-4" aria-hidden />
          Add note
        </Button>
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            resolveThread(threadId);
            onClose();
          }}
          disabled={t.resolved}
        >
          <CheckCircle2 className="size-4" aria-hidden />
          Mark resolved
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- Alert ---------------------------------- */

function AlertDetail({ alertId, onClose }: { alertId: string; onClose: () => void }) {
  const { state, openDetail, navigate, pushToast } = useAdminWorkflow();
  const alert = ADMIN_ALERTS.find((a) => a.id === alertId);
  if (!alert) return <p className="text-[13px] text-muted-foreground">Alert not found.</p>;
  const booking = alert.bookingRef
    ? Object.values(state.bookings).find((b) => b.ref === alert.bookingRef)
    : undefined;

  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Operational alert</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {alert.title}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{alert.detail}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={adminChipClass(
            alert.severity === "critical" ? "alert" : alert.severity === "warning" ? "warn" : "info",
          )}
        >
          {alert.severity === "critical" ? "Critical" : alert.severity === "warning" ? "Warning" : "Notice"}
        </span>
        {alert.bookingRef ? <span className={adminChipClass("muted")}>{alert.bookingRef}</span> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {booking ? (
          <Button
            type="button"
            className="touch-manipulation rounded-xl"
            onClick={() => openDetail({ kind: "booking", bookingId: booking.id })}
          >
            <CalendarDays className="size-4" aria-hidden />
            Open booking
          </Button>
        ) : (
          <Button
            type="button"
            className="touch-manipulation rounded-xl"
            onClick={() => {
              navigate("dispatch");
              onClose();
            }}
          >
            <Radar className="size-4" aria-hidden />
            Open dispatch
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            pushToast({ tone: "success", title: "Alert acknowledged", body: alert.title });
            onClose();
          }}
        >
          <CheckCircle2 className="size-4" aria-hidden />
          Acknowledge
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- Payout --------------------------------- */

function PayoutDetail({ payoutId, onClose }: { payoutId: string; onClose: () => void }) {
  const { state, setPayoutStatus } = useAdminWorkflow();
  const p = state.payouts[payoutId];
  if (!p) return <p className="text-[13px] text-muted-foreground">Payout not found.</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-[15px] font-semibold text-primary">
          {p.initials}
        </span>
        <div>
          <p className={cn(bpOverline, "text-primary/85")}>Payout</p>
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.2rem] font-normal sm:text-[1.32rem]")}>
            {p.cleanerName}
          </h2>
          <p className="text-[12.5px] text-muted-foreground">{p.periodLabel}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={adminChipClass(
            p.status === "released" ? "success" : p.status === "held" ? "warn" : "info",
          )}
        >
          {ADMIN_PAYOUT_LABEL[p.status]}
        </span>
        <span className={adminChipClass("muted")}>{formatZar(p.amountZar)}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          disabled={p.status === "released"}
          onClick={() => {
            setPayoutStatus(payoutId, "released");
            onClose();
          }}
        >
          <Wallet className="size-4" aria-hidden />
          Release
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="touch-manipulation rounded-xl"
          disabled={p.status === "scheduled"}
          onClick={() => setPayoutStatus(payoutId, "scheduled")}
        >
          <CalendarClock className="size-4" aria-hidden />
          Reschedule
        </Button>
        <Button
          type="button"
          variant="outline"
          className="touch-manipulation rounded-xl"
          disabled={p.status === "held"}
          onClick={() => setPayoutStatus(payoutId, "held")}
        >
          <AlertTriangle className="size-4" aria-hidden />
          Hold
        </Button>
      </div>
    </div>
  );
}

/* --------------------------- Create / Pricing / Area ---------------------- */

function CreateBookingDetail({ onClose }: { onClose: () => void }) {
  const { pushToast } = useAdminWorkflow();
  const [service, setService] = useState("Regular cleaning");
  const [area, setArea] = useState("Sea Point");
  const services = ["Regular Cleaning", "Deep Cleaning", "Move In / Move Out"];
  const areas = ["Sea Point", "Green Point", "Camps Bay", "Woodstock", "Tamboerskloof"];
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>New booking</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          Create on behalf of customer
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">Mock-only flow — no live record is created.</p>
      </div>
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/85">Service</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {services.map((s) => {
            const on = service === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setService(s)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium ring-1",
                  on
                    ? "bg-primary/[0.1] text-primary ring-primary/30"
                    : "bg-card text-muted-foreground ring-border/70 hover:bg-muted/45",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/85">Area</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {areas.map((a) => {
            const on = area === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setArea(a)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium ring-1",
                  on
                    ? "bg-primary/[0.1] text-primary ring-primary/30"
                    : "bg-card text-muted-foreground ring-border/70 hover:bg-muted/45",
                )}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            pushToast({
              tone: "success",
              title: "Booking drafted",
              body: `${service} · ${area} · queued for matching`,
            });
            onClose();
          }}
        >
          <Sparkles className="size-4" aria-hidden />
          Confirm draft
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

function PricingDetail({ pricingId, onClose }: { pricingId: string; onClose: () => void }) {
  const { pushToast } = useAdminWorkflow();
  const row = ADMIN_PRICING_CONTROLS.find((p) => p.id === pricingId) ?? ADMIN_PRICING_CONTROLS[0];
  const [value, setValue] = useState<string>(row.value);
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>Pricing</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          {row.label}
        </h2>
      </div>
      <label className="block">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Rate</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-[14px] outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          onClick={() => {
            pushToast({ tone: "success", title: "Rate updated", body: `${row.label} → ${value}` });
            onClose();
          }}
        >
          Save rate
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

function AddAreaDetail({ onClose }: { onClose: () => void }) {
  const { pushToast } = useAdminWorkflow();
  const [name, setName] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(bpOverline, "text-primary/85")}>New area</p>
        <h2 className={cn(bpSectionHeading, "booking-display mt-1 text-[1.2rem] font-normal sm:text-[1.32rem]")}>
          Add bookable area
        </h2>
      </div>
      <label className="block">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Area name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sea Point"
          className="mt-1 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-[14px] outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="touch-manipulation rounded-xl"
          disabled={!name.trim()}
          onClick={() => {
            pushToast({ tone: "success", title: "Area added", body: name.trim() });
            onClose();
          }}
        >
          <MapPin className="size-4" aria-hidden />
          Add area
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

/* --------------------------------- Routing -------------------------------- */

function detailHeader(target: AdminDetailTarget) {
  switch (target.kind) {
    case "booking":
      return { icon: CalendarDays, label: "Booking" };
    case "reassign":
      return { icon: Users, label: "Reassign" };
    case "reschedule":
      return { icon: CalendarClock, label: "Reschedule" };
    case "cancel":
      return { icon: Ban, label: "Cancel" };
    case "cleaner":
      return { icon: Users, label: "Cleaner" };
    case "customer":
      return { icon: UserSquare2, label: "Customer" };
    case "slot":
      return { icon: Radar, label: "Slot" };
    case "support":
      return { icon: Headphones, label: "Support" };
    case "alert":
      return { icon: AlertTriangle, label: "Alert" };
    case "payout":
      return { icon: Wallet, label: "Payout" };
    case "createBooking":
      return { icon: Sparkles, label: "New booking" };
    case "addArea":
      return { icon: MapPin, label: "New area" };
    case "editPricing":
      return { icon: TrendingUp, label: "Pricing" };
  }
}

export function AdminDetailSheet() {
  const { detailTarget, closeDetail } = useAdminWorkflow();
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

  const header = useMemo(() => (detailTarget ? detailHeader(detailTarget) : null), [detailTarget]);

  if (!open || !detailTarget || !header) return null;

  let body: React.ReactNode = null;
  if (detailTarget.kind === "booking") body = <BookingDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "reassign") body = <ReassignDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "reschedule") body = <RescheduleDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "cancel") body = <CancelDetail bookingId={detailTarget.bookingId} onClose={closeDetail} />;
  else if (detailTarget.kind === "cleaner") body = <CleanerProfile cleanerId={detailTarget.cleanerId} onClose={closeDetail} />;
  else if (detailTarget.kind === "customer") body = <CustomerProfile customerName={detailTarget.customerName} onClose={closeDetail} />;
  else if (detailTarget.kind === "slot") body = <SlotDetail slotId={detailTarget.slotId} onClose={closeDetail} />;
  else if (detailTarget.kind === "support") body = <SupportThreadDetail threadId={detailTarget.threadId} onClose={closeDetail} />;
  else if (detailTarget.kind === "alert") body = <AlertDetail alertId={detailTarget.alertId} onClose={closeDetail} />;
  else if (detailTarget.kind === "payout") body = <PayoutDetail payoutId={detailTarget.payoutId} onClose={closeDetail} />;
  else if (detailTarget.kind === "createBooking") body = <CreateBookingDetail onClose={closeDetail} />;
  else if (detailTarget.kind === "addArea") body = <AddAreaDetail onClose={closeDetail} />;
  else if (detailTarget.kind === "editPricing") body = <PricingDetail pricingId={detailTarget.pricingId} onClose={closeDetail} />;

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
