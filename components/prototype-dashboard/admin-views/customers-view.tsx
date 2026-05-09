"use client";

import { useMemo } from "react";
import { CalendarDays, MapPin, Repeat2, Search, Sparkles, UserSquare2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";
import { formatZar } from "@/components/booking-prototype/mock-pricing";

import {
  ADMIN_CUSTOMERS,
  ADMIN_CUSTOMER_FILTERS,
  type AdminCustomer,
} from "../mock-admin-data";
import { adminChipClass, adminSectionClass } from "../admin-dashboard-ui";
import { useAdminWorkflow } from "../admin-workflow-context";

type Filter = (typeof ADMIN_CUSTOMER_FILTERS)[number];

function matches(filter: Filter, query: string, c: AdminCustomer): boolean {
  if (filter === "Recurring" && !c.recurring) return false;
  if (filter === "VIP" && !c.flags?.includes("VIP")) return false;
  if (filter === "New" && !c.flags?.includes("First-time")) return false;
  if (filter === "Attention" && !(c.flags?.includes("Reschedule") || c.flags?.includes("High value"))) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [c.name, c.area, c.preferredCleaner ?? "", ...(c.flags ?? [])]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function AdminCustomersView() {
  const { state, setCustomerFilter, setCustomerQuery, openDetail } = useAdminWorkflow();
  const filter = state.customerFilter as Filter;
  const query = state.customerQuery;
  const items = useMemo(() => ADMIN_CUSTOMERS.filter((c) => matches(filter, query, c)), [filter, query]);

  const totalLifetime = useMemo(
    () => ADMIN_CUSTOMERS.reduce((n, c) => n + c.lifetimeZar, 0),
    [],
  );
  const recurringCount = useMemo(() => ADMIN_CUSTOMERS.filter((c) => c.recurring).length, []);

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Customers</p>
          <h1 className="booking-display mt-1 text-[1.4rem] font-normal tracking-tight text-foreground sm:text-[1.55rem]">
            Customer registry
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Lifetime, recurring rhythm, and care flags.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={adminChipClass("muted")}>{ADMIN_CUSTOMERS.length} customers</span>
          <button
            type="button"
            onClick={() => openDetail({ kind: "createBooking" })}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/25 motion-safe:transition-[background-color] hover:bg-primary/15"
          >
            <Sparkles className="size-3" aria-hidden />
            New booking
          </button>
        </div>
      </div>

      <section className={cn(adminSectionClass({ priority: "default" }), "p-3 sm:p-4")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setCustomerFilter("All")}
            className={cn(
              "rounded-xl bg-muted/25 px-3 py-2.5 text-left ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/40 hover:ring-primary/20",
              filter === "All" && "ring-primary/30 bg-primary/[0.06]",
            )}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Total customers</p>
            <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-foreground">{ADMIN_CUSTOMERS.length}</p>
          </button>
          <button
            type="button"
            onClick={() => setCustomerFilter("Recurring")}
            className={cn(
              "rounded-xl bg-muted/25 px-3 py-2.5 text-left ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/40 hover:ring-primary/20",
              filter === "Recurring" && "ring-primary/30 bg-primary/[0.06]",
            )}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Recurring</p>
            <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-foreground">{recurringCount}</p>
          </button>
          <div className="col-span-2 rounded-xl bg-primary/[0.06] px-3 py-2.5 ring-1 ring-primary/20 sm:col-span-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-primary/85">Lifetime value</p>
            <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-foreground">{formatZar(totalLifetime)}</p>
          </div>
        </div>
      </section>

      <section className={cn(adminSectionClass({ priority: "default" }), "p-3 sm:p-4")}>
        <div className="flex flex-col gap-2.5">
          <label className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" strokeWidth={1.7} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Search name, area, cleaner"
              className="h-10 w-full rounded-xl border border-border/80 bg-background/70 pl-9 pr-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground motion-safe:transition-[border-color,box-shadow] focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label="Search customers"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ADMIN_CUSTOMER_FILTERS.map((f) => {
              const on = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCustomerFilter(f)}
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
            <p className="text-[13px] font-medium text-foreground">No customers match</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Try a different filter or search.</p>
          </div>
        ) : (
          items.map((c) => (
            <article
              key={c.id}
              className={cn(
                adminSectionClass({ priority: "default" }),
                "p-3 sm:p-4 motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-px motion-safe:hover:shadow-[0_8px_24px_-14px_rgba(53,99,255,0.18)]",
              )}
            >
              <button
                type="button"
                onClick={() => openDetail({ kind: "customer", customerName: c.name })}
                className="flex w-full flex-wrap items-start justify-between gap-2 text-left"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-[12px] font-semibold text-primary">
                    {c.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className={cn(bpSectionHeading, "text-[14.5px]")}>{c.name}</p>
                      {c.recurring ? (
                        <span className={adminChipClass("info", "px-2 py-0.5 text-[10px]")}>
                          <Repeat2 className="size-3" aria-hidden />
                          Recurring
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-primary/80" strokeWidth={1.7} aria-hidden />
                      {c.area}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {c.flags?.map((flag) => (
                    <span
                      key={flag}
                      className={adminChipClass(
                        flag === "VIP" || flag === "High value"
                          ? "active"
                          : flag === "Reschedule"
                            ? "warn"
                            : "muted",
                        "px-2 py-0.5 text-[10px]",
                      )}
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </button>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Bookings</p>
                  <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-foreground">{c.bookingsCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Last visit</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold tabular-nums text-foreground">
                    <CalendarDays className="size-3.5 text-primary/80" strokeWidth={1.7} aria-hidden />
                    {c.lastVisitLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Lifetime</p>
                  <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-foreground">{formatZar(c.lifetimeZar)}</p>
                </div>
              </div>

              {c.preferredCleaner ? (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/25 px-2 py-0.5 text-[10.5px] text-muted-foreground">
                  <UserSquare2 className="size-3" aria-hidden />
                  Preferred · {c.preferredCleaner}
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
