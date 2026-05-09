"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, Heart, Leaf, MapPin, Repeat2, Sparkles, Star } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { customerSectionClass } from "../customer-dashboard-ui";
import { useCustomerWorkflow, type RecurringRhythm } from "../customer-workflow-context";
import { customerHasPreferenceDetail } from "../customer-dashboard-visibility";
import {
  MOCK_CLEANING_PRIORITIES,
  MOCK_DETAIL_BOOKING,
  MOCK_PREFERENCES,
  MOCK_PRODUCT_PREFS,
  MOCK_SAVED_ADDRESS,
  MOCK_VISIT_NOTES,
  SUGGESTED_ARRIVAL_WINDOWS,
  SUGGESTED_EXTRAS_LIST,
} from "../mock-customer-data";

const RHYTHM_OPTIONS: { id: RecurringRhythm; label: string; helper: string }[] = [
  { id: "weekly", label: "Weekly", helper: "Every 7 days" },
  { id: "biweekly", label: "Bi-weekly", helper: "Most popular" },
  { id: "monthly", label: "Monthly", helper: "Reset visits" },
  { id: "off", label: "Pause", helper: "No recurring" },
];

const SUGGESTED_PRIORITIES = [
  { label: "Kitchen first", helper: "Counters, sink, appliances first." },
  { label: "Quiet arrival", helper: "Soft knock, no loud vacuum to start." },
  { label: "Pet-sensitive products only", helper: "Approved list on file." },
  { label: "Skip the office", helper: "Don't enter the closed study." },
];

export function PreferencesView() {
  const hasDetail = customerHasPreferenceDetail();
  const {
    preferenceFlags,
    fragranceFree,
    selectedArrivalWindow,
    recurringRhythm,
    selectedExtras,
    prioritySet,
    togglePreferenceFlag,
    setFragranceFree,
    setArrivalWindow,
    setRecurringRhythm,
    toggleExtra,
    togglePriority,
    pushToast,
  } = useCustomerWorkflow();

  return (
    <div className="space-y-3 md:space-y-4">
      <div>
        <p className={bpOverline}>Profile</p>
        <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.5rem]">
          Preferences
        </h1>
        <p className="mt-1 max-w-lg text-[12px] text-muted-foreground sm:text-[13px]">Saved for every visit.</p>
      </div>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary/90" strokeWidth={1.75} aria-hidden />
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Address</h2>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-lg text-primary"
            onClick={() => pushToast({ tone: "info", title: "Address editor", body: "Opens in the live app." })}
          >
            Edit
          </Button>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Primary home</p>
        <div className="mt-2 rounded-xl bg-muted/25 p-3 ring-1 ring-border/55">
          <p className="text-[13px] font-semibold text-foreground">{MOCK_SAVED_ADDRESS.label}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{MOCK_SAVED_ADDRESS.line}</p>
        </div>
      </section>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-primary/90" strokeWidth={1.75} aria-hidden />
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Arrival window</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Pick the window we should hold</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTED_ARRIVAL_WINDOWS.map((w) => {
            const on = selectedArrivalWindow === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() => setArrivalWindow(w)}
                aria-pressed={on}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.97]",
                  on
                    ? "bg-primary/[0.1] text-foreground ring-primary/30"
                    : "bg-muted/25 text-muted-foreground ring-border/65 hover:bg-muted/55 hover:text-foreground",
                )}
              >
                {on ? <CheckCircle2 className="size-3 text-primary" strokeWidth={2.2} aria-hidden /> : null}
                {w}
              </button>
            );
          })}
        </div>
      </section>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex items-center gap-2">
          <Repeat2 className="size-4 text-primary/90" strokeWidth={1.75} aria-hidden />
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Recurring rhythm</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">How often we visit</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          {RHYTHM_OPTIONS.map((r) => {
            const on = recurringRhythm === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRecurringRhythm(r.id)}
                aria-pressed={on}
                className={cn(
                  "rounded-2xl px-3 py-2 text-left ring-1 motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.99]",
                  on
                    ? "bg-primary/[0.08] text-foreground ring-primary/30"
                    : "bg-muted/25 text-muted-foreground ring-border/65 hover:bg-muted/55 hover:text-foreground",
                )}
              >
                <p className="text-[13.5px] font-semibold text-foreground">{r.label}</p>
                <p className="text-[11px] text-muted-foreground">{r.helper}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary/90" strokeWidth={1.75} aria-hidden />
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>How we clean</h2>
          </div>
          {!hasDetail ? (
            <Link
              href="/prototype/booking"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-8 rounded-lg text-[12px]")}
            >
              Set preferences
            </Link>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Products and focus</p>

        <button
          type="button"
          onClick={() => setFragranceFree(!fragranceFree)}
          aria-pressed={fragranceFree}
          className={cn(
            "mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left ring-1 motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.99]",
            fragranceFree
              ? "bg-primary/[0.06] ring-primary/25"
              : "bg-muted/25 ring-border/55 hover:bg-muted/45",
          )}
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              fragranceFree ? "bg-primary/15 text-primary" : "bg-muted/45 text-muted-foreground",
            )}
          >
            <Leaf className="size-4" strokeWidth={1.85} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold text-foreground">Fragrance-free products</span>
            <span className="block text-[11.5px] text-muted-foreground">Eco-friendly, low-aroma kit</span>
          </span>
          <span
            className={cn(
              "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 motion-safe:transition-[background-color] motion-safe:duration-200",
              fragranceFree ? "bg-primary" : "bg-muted-foreground/40",
            )}
            aria-hidden
          >
            <span
              className={cn(
                "size-4 rounded-full bg-background shadow-sm motion-safe:transition-transform motion-safe:duration-200",
                fragranceFree ? "translate-x-4" : "translate-x-0",
              )}
            />
          </span>
        </button>

        {MOCK_PREFERENCES.length === 0 ? null : (
          <ul className="mt-2 space-y-1">
            {MOCK_PREFERENCES.map((p) => {
              const on = preferenceFlags[p] ?? true;
              return (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => togglePreferenceFlag(p)}
                    aria-pressed={on}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] ring-1 motion-safe:transition-[background-color,color] motion-safe:duration-200",
                      on ? "bg-primary/[0.06] text-foreground ring-primary/20" : "bg-muted/20 text-muted-foreground line-through ring-border/55 hover:bg-muted/45",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 size-1.5 shrink-0 rounded-full",
                        on ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                      aria-hidden
                    />
                    <span className="leading-snug">{p}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex items-center gap-2">
          <Star className="size-4 text-primary/90" strokeWidth={1.75} aria-hidden />
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Priorities</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Where to focus</p>
        <ul className="mt-2 space-y-1.5">
          {(MOCK_CLEANING_PRIORITIES.length ? MOCK_CLEANING_PRIORITIES : SUGGESTED_PRIORITIES).map((row) => {
            const label = row.label;
            const helper = "detail" in row ? row.detail : row.helper;
            const on = prioritySet.includes(label);
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => togglePriority(label)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left ring-1 motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.99]",
                    on
                      ? "bg-primary/[0.06] text-foreground ring-primary/20"
                      : "bg-muted/20 text-muted-foreground ring-border/55 hover:bg-muted/45 hover:text-foreground",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-foreground">{label}</span>
                    <span className="block text-[11.5px] text-muted-foreground">{helper}</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full ring-1",
                      on ? "bg-primary text-primary-foreground ring-primary" : "bg-background ring-border",
                    )}
                    aria-hidden
                  >
                    {on ? <CheckCircle2 className="size-3.5" strokeWidth={2.4} /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex items-center gap-2">
          <Heart className="size-4 text-primary/90" strokeWidth={1.75} aria-hidden />
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Extras</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Add-ons you like — tap to toggle</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTED_EXTRAS_LIST.map((x) => {
            const on = selectedExtras.includes(x);
            return (
              <button
                key={x}
                type="button"
                onClick={() => toggleExtra(x)}
                aria-pressed={on}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200 active:scale-[0.97]",
                  on
                    ? "bg-primary/[0.1] text-foreground ring-primary/30"
                    : "bg-muted/25 text-muted-foreground ring-border/65 hover:bg-muted/55 hover:text-foreground",
                )}
              >
                {on ? <CheckCircle2 className="size-3 text-primary" strokeWidth={2.2} aria-hidden /> : null}
                {x}
              </button>
            );
          })}
        </div>
      </section>

      <section className={customerSectionClass({ priority: "quiet" })}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Visit notes</h2>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-lg text-primary"
            onClick={() => pushToast({ tone: "info", title: "Notes editor", body: "Opens in the live app." })}
          >
            Edit
          </Button>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Access &amp; pets</p>
        <p className="mt-2 text-[13px] text-foreground">{MOCK_VISIT_NOTES}</p>
      </section>

      <section className={customerSectionClass({ priority: "quiet" })}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Products</h2>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-lg text-primary"
            onClick={() => setFragranceFree(true)}
          >
            Reset
          </Button>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Sensitivities</p>
        <p className="mt-2 text-[13px] text-foreground">{MOCK_PRODUCT_PREFS}</p>
      </section>

      <section className={customerSectionClass({ priority: "default" })}>
        <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Visit snapshot</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {MOCK_DETAIL_BOOKING ? "From next booking" : "After you book"}
        </p>
        {MOCK_DETAIL_BOOKING ? (
          <dl className="mt-2 grid gap-1.5 text-[12px] sm:grid-cols-2">
            <div className="rounded-lg bg-muted/20 px-2.5 py-2 ring-1 ring-border/50">
              <dt className="text-muted-foreground">Extras</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {selectedExtras.length > 0 ? selectedExtras.join(" · ") : MOCK_DETAIL_BOOKING.extrasSummary}
              </dd>
            </div>
            <div className="rounded-lg bg-muted/20 px-2.5 py-2 ring-1 ring-border/50">
              <dt className="text-muted-foreground">Window</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {selectedArrivalWindow}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="mt-2 rounded-xl border border-border/55 bg-muted/[0.06] px-3 py-3">
            <p className="text-[12px] text-muted-foreground">Extras and timing fill in from your booking.</p>
            <Link
              href="/prototype/booking"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 h-8 rounded-lg text-[12px]")}
            >
              Book
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
