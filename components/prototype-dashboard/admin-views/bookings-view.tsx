"use client";

import { useMemo } from "react";
import { AlertTriangle, CalendarDays, Clock3, MapPin, Repeat2, Search, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";
import { formatZar } from "@/components/booking-prototype/mock-pricing";

import {
  ADMIN_BOOKING_FILTERS,
  ADMIN_BOOKING_STATUS_LABEL,
  type AdminBooking,
  type AdminBookingStatus,
} from "../mock-admin-data";
import { adminChipClass, adminSectionClass, type AdminChipVariant } from "../admin-dashboard-ui";
import { useAdminWorkflow } from "../admin-workflow-context";

const STATUS_CHIP: Record<AdminBookingStatus, AdminChipVariant> = {
  requested: "warn",
  confirmed: "info",
  matching_cleaner: "warn",
  assigned: "info",
  en_route: "active",
  arrived: "active",
  in_progress: "active",
  completed: "success",
  cancelled: "alert",
};

type Filter = (typeof ADMIN_BOOKING_FILTERS)[number];

function isAttentionState(b: AdminBooking): boolean {
  // "Attention" surfaces cancelled bookings and risky stalled lanes — the
  // cancellation contract carries risk metadata via `riskFlags`.
  return (
    b.status === "cancelled" ||
    b.status === "matching_cleaner" ||
    (b.riskFlags?.length ?? 0) > 0
  );
}

function matches(filter: Filter, query: string, b: AdminBooking): boolean {
  if (filter === "Today" && b.dateLabel !== "Today") return false;
  if (filter === "Attention" && !isAttentionState(b)) return false;
  if (filter === "Recurring" && !b.recurring) return false;
  if (filter === "Completed" && b.status !== "completed") return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [b.ref, b.customerName, b.area, b.serviceLabel, b.cleanerName ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function AdminBookingsView() {
  const {
    state,
    setBookingFilter,
    setBookingQuery,
    openDetail,
    advanceBookingStatus,
  } = useAdminWorkflow();
  const filter = state.bookingFilter as Filter;
  const query = state.bookingQuery;
  const allBookings = useMemo(() => Object.values(state.bookings), [state.bookings]);
  const items = useMemo(() => allBookings.filter((b) => matches(filter, query, b)), [allBookings, filter, query]);

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Bookings</p>
          <h1 className="booking-display mt-1 text-[1.4rem] font-normal tracking-tight text-foreground sm:text-[1.55rem]">
            Booking operations
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Search, filter, and triage today's queue.</p>
        </div>
        <span className={adminChipClass("muted")}>{items.length} shown</span>
      </div>

      <section className={cn(adminSectionClass({ priority: "default" }), "p-3 sm:p-4")}>
        <div className="flex flex-col gap-2.5">
          <label className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" strokeWidth={1.7} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setBookingQuery(e.target.value)}
              placeholder="Search ref, customer, area, cleaner"
              className="h-10 w-full rounded-xl border border-border/80 bg-background/70 pl-9 pr-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground motion-safe:transition-[border-color,box-shadow] focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label="Search bookings"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ADMIN_BOOKING_FILTERS.map((f) => {
              const on = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setBookingFilter(f)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 motion-safe:transition-[background-color,color,box-shadow] motion-safe:duration-200",
                    on
                      ? "bg-primary/[0.1] text-primary ring-primary/30 shadow-[0_2px_8px_-4px_rgba(53,99,255,0.28)]"
                      : "bg-card text-muted-foreground ring-border/70 hover:bg-muted/45 hover:text-foreground hover:ring-primary/20",
                  )}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        {items.length === 0 ? (
          <div className={cn(adminSectionClass({ priority: "quiet" }), "text-center")}>
            <p className="text-[13px] font-medium text-foreground">No bookings match</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Try a different filter or search.</p>
          </div>
        ) : (
          items.map((b) => (
            <article
              key={b.id}
              className={cn(
                adminSectionClass({ priority: "default" }),
                "p-3 sm:p-4 motion-safe:transition-[transform,box-shadow,ring-color] motion-safe:duration-200 motion-safe:hover:-translate-y-px motion-safe:hover:shadow-[0_8px_24px_-14px_rgba(53,99,255,0.18)] motion-safe:hover:ring-primary/15",
              )}
            >
              <button
                type="button"
                onClick={() => openDetail({ kind: "booking", bookingId: b.id })}
                className="flex w-full flex-wrap items-start justify-between gap-2 text-left"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[12px] font-semibold text-primary">
                    {b.customerInitials}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className={cn(bpSectionHeading, "text-[14.5px]")}>{b.serviceLabel}</p>
                      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{b.ref}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {b.customerName} · {b.area}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {b.recurring ? (
                    <span className={adminChipClass("info")}>
                      <Repeat2 className="size-3" aria-hidden />
                      Recurring
                    </span>
                  ) : null}
                  <span className={adminChipClass(STATUS_CHIP[b.status])}>
                    {ADMIN_BOOKING_STATUS_LABEL[b.status]}
                  </span>
                </div>
              </button>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0 text-primary/80" strokeWidth={1.7} aria-hidden />
                  {b.dateLabel} · {b.timeLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5 shrink-0 text-primary/80" strokeWidth={1.7} aria-hidden />
                  Estimated {b.durationLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-primary/80" strokeWidth={1.7} aria-hidden />
                  {b.addressLine}
                </span>
                <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground">
                  {formatZar(b.estimateZar)}
                </span>
                {b.cleanerName ? (
                  <button
                    type="button"
                    onClick={() => openDetail({ kind: "reassign", bookingId: b.id })}
                    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-foreground hover:bg-muted/50"
                  >
                    Cleaner ·<span className="font-medium text-foreground">{b.cleanerName}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openDetail({ kind: "reassign", bookingId: b.id })}
                    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-amber-600 hover:bg-amber-500/10 dark:text-amber-300"
                  >
                    <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                    Unassigned · match
                  </button>
                )}
              </div>

              {b.preferenceLabel ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  <span className="rounded-full bg-primary/[0.07] px-2 py-0.5 text-[10.5px] font-medium text-primary ring-1 ring-primary/15">
                    {b.preferenceLabel}
                  </span>
                </p>
              ) : null}

              {b.riskFlags && b.riskFlags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {b.riskFlags.map((flag) => (
                    <span key={flag} className={adminChipClass("alert", "px-2 py-0.5 text-[10px]")}>{flag}</span>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/50 pt-2.5">
                <button
                  type="button"
                  onClick={() => openDetail({ kind: "reassign", bookingId: b.id })}
                  className="rounded-lg bg-muted/25 px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/50 hover:ring-primary/20"
                >
                  Reassign
                </button>
                <button
                  type="button"
                  onClick={() => openDetail({ kind: "reschedule", bookingId: b.id })}
                  className="rounded-lg bg-muted/25 px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/50 hover:ring-primary/20"
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => openDetail({ kind: "customer", customerName: b.customerName })}
                  className="rounded-lg bg-muted/25 px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/50 hover:ring-primary/20"
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => advanceBookingStatus(b.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11.5px] font-medium text-primary ring-1 ring-primary/25 motion-safe:transition-[background-color,box-shadow] hover:bg-primary/15 hover:ring-primary/35"
                >
                  <Sparkles className="size-3" aria-hidden />
                  Advance
                </button>
                <button
                  type="button"
                  onClick={() => openDetail({ kind: "cancel", bookingId: b.id })}
                  className="rounded-lg bg-muted/25 px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-rose-500/10 hover:text-rose-600 hover:ring-rose-500/30 dark:hover:text-rose-300"
                >
                  Cancel
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
