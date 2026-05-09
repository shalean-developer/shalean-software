"use client";

import { useMemo } from "react";
import { MapPin, Search, Star } from "lucide-react";

import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";
import { formatZar } from "@/components/booking-prototype/mock-pricing";

import {
  ADMIN_CLEANER_FILTERS,
  ADMIN_CLEANER_STATUS_LABEL,
  type AdminCleaner,
  type AdminCleanerStatus,
} from "../mock-admin-data";
import { adminChipClass, adminSectionClass, type AdminChipVariant } from "../admin-dashboard-ui";
import { useAdminWorkflow } from "../admin-workflow-context";

const STATUS_CHIP: Record<AdminCleanerStatus, AdminChipVariant> = {
  available: "success",
  assigned: "info",
  en_route: "active",
  in_visit: "info",
  paused: "warn",
  offline: "muted",
};

type Filter = (typeof ADMIN_CLEANER_FILTERS)[number];

function matches(filter: Filter, query: string, c: AdminCleaner): boolean {
  if (filter === "Available" && c.status !== "available") return false;
  if (filter === "On visit" && c.status !== "in_visit" && c.status !== "en_route") return false;
  if (filter === "Top performers" && (c.rating < 4.85 || c.completionRate < 97)) return false;
  if (filter === "Paused" && c.status !== "paused") return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [c.name, c.area, ...(c.badges ?? [])]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function AdminCleanersView() {
  const {
    state,
    setCleanerFilter,
    setCleanerQuery,
    openDetail,
  } = useAdminWorkflow();
  const filter = state.cleanerFilter as Filter;
  const query = state.cleanerQuery;
  const all = useMemo(() => Object.values(state.cleaners), [state.cleaners]);
  const items = useMemo(() => all.filter((c) => matches(filter, query, c)), [all, filter, query]);

  const counts = useMemo(
    () => ({
      available: all.filter((c) => c.status === "available").length,
      onVisit: all.filter((c) => c.status === "in_visit" || c.status === "en_route").length,
      paused: all.filter((c) => c.status === "paused").length,
      offline: all.filter((c) => c.status === "offline").length,
    }),
    [all],
  );

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Network</p>
          <h1 className="booking-display mt-1 text-[1.4rem] font-normal tracking-tight text-foreground sm:text-[1.55rem]">
            Cleaners
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Availability, performance and reliability across the network.</p>
        </div>
        <span className={adminChipClass("muted")}>{all.length} cleaners</span>
      </div>

      <section className={cn(adminSectionClass({ priority: "default" }), "p-3 sm:p-4")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Available", value: counts.available, tone: "success" as AdminChipVariant, filter: "Available" as Filter },
            { label: "On visit", value: counts.onVisit, tone: "info" as AdminChipVariant, filter: "On visit" as Filter },
            { label: "Paused", value: counts.paused, tone: "warn" as AdminChipVariant, filter: "Paused" as Filter },
            { label: "Offline", value: counts.offline, tone: "muted" as AdminChipVariant, filter: "All" as Filter },
          ].map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={() => setCleanerFilter(row.filter)}
              className={cn(
                "rounded-xl bg-muted/25 px-3 py-2 text-left ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/40 hover:ring-primary/20",
                filter === row.filter && "ring-primary/30 bg-primary/[0.06]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{row.label}</p>
                <span className={adminChipClass(row.tone, "px-1.5 py-0.5 text-[9.5px]")}>{row.value}</span>
              </div>
              <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-foreground">{row.value}</p>
            </button>
          ))}
        </div>
      </section>

      <section className={cn(adminSectionClass({ priority: "default" }), "p-3 sm:p-4")}>
        <div className="flex flex-col gap-2.5">
          <label className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" strokeWidth={1.7} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setCleanerQuery(e.target.value)}
              placeholder="Search name, area, badge"
              className="h-10 w-full rounded-xl border border-border/80 bg-background/70 pl-9 pr-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground motion-safe:transition-[border-color,box-shadow] focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label="Search cleaners"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ADMIN_CLEANER_FILTERS.map((f) => {
              const on = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCleanerFilter(f)}
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

      <section className="grid gap-2 sm:grid-cols-2">
        {items.length === 0 ? (
          <div className={cn(adminSectionClass({ priority: "quiet" }), "text-center sm:col-span-2")}>
            <p className="text-[13px] font-medium text-foreground">No cleaners match</p>
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
                onClick={() => openDetail({ kind: "cleaner", cleanerId: c.id })}
                className="flex w-full items-start justify-between gap-2 text-left"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-[12px] font-semibold text-primary ring-2 ring-primary/20">
                    {c.initials}
                  </span>
                  <div className="min-w-0">
                    <p className={cn(bpSectionHeading, "text-[14.5px]")}>{c.name}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-primary/80" strokeWidth={1.7} aria-hidden />
                      {c.area}
                    </p>
                  </div>
                </div>
                <span className={adminChipClass(STATUS_CHIP[c.status])}>
                  {ADMIN_CLEANER_STATUS_LABEL[c.status]}
                </span>
              </button>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Rating</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold tabular-nums text-foreground">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    {c.rating.toFixed(2)}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground">{c.reviewCount} reviews</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Completion</p>
                  <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-foreground">{c.completionRate}%</p>
                  <p className="text-[10.5px] text-muted-foreground">all-time</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Today</p>
                  <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-foreground">
                    {c.visitsToday} · {c.hoursToday}h
                  </p>
                  <p className="text-[10.5px] text-muted-foreground">{formatZar(c.earningsTodayZar)}</p>
                </div>
              </div>

              {(c.badges && c.badges.length > 0) || c.lastSeenLabel ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2.5">
                  {c.badges?.map((badge) => (
                    <span key={badge} className={adminChipClass("info", "px-2 py-0.5 text-[10px]")}>{badge}</span>
                  ))}
                  {c.lastSeenLabel ? (
                    <span className="ml-auto text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                      {c.lastSeenLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
