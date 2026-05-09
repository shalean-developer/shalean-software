"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Repeat2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { customerSectionClass } from "../customer-dashboard-ui";
import { useCustomerWorkflow } from "../customer-workflow-context";
import { customerHasPastVisits } from "../customer-dashboard-visibility";
import { MOCK_CUSTOMER, MOCK_PAST } from "../mock-customer-data";

const ONBOARDING_STEPS = ["Book a visit", "Set preferences", "Meet your cleaner", "Enjoy a calmer home"] as const;

const SERVICE_LABELS = ["Regular cleaning", "Deep cleaning", "Recurring"] as const;

export function DashboardOverviewEmpty() {
  const hasPast = customerHasPastVisits();
  const previewPast = MOCK_PAST.slice(0, 2);
  const { navigate, openDetail, pushToast } = useCustomerWorkflow();

  return (
    <div className="space-y-3 md:space-y-4">
      <div>
        <p className={bpOverline}>Home care</p>
        <h1 className="booking-display mt-1 text-[1.4rem] font-normal leading-[1.22] tracking-[-0.01em] text-foreground sm:text-[1.55rem]">
          Your home care space is ready.
        </h1>
        <p className="mt-1 max-w-md text-[12px] text-muted-foreground sm:text-[13px]">
          {MOCK_CUSTOMER.firstName} — bookings and updates will appear here.
        </p>
      </div>

      <section
        className={cn(
          customerSectionClass({ priority: "hero" }),
          "relative overflow-hidden p-5 sm:p-6 md:p-7",
        )}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-12 size-48 rounded-full bg-primary/[0.07] blur-2xl proto-dash-empty-shimmer"
          aria-hidden
        />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,200px)] lg:items-center">
          <div className="min-w-0 space-y-3">
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.2rem] font-normal tracking-tight sm:text-[1.3rem]")}>
              Welcome to Shalean.
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/prototype/booking"
                className={cn(buttonVariants({ variant: "default", size: "default" }), "rounded-xl shadow-sm")}
                onClick={() =>
                  pushToast({ tone: "primary", title: "Booking flow opened", body: "Continue your visit setup." })
                }
              >
                Book your first visit
              </Link>
              <Link
                href="/prototype/booking"
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "rounded-xl ring-1 ring-border/80 bg-background/60 backdrop-blur-sm motion-safe:transition-shadow hover:ring-primary/20",
                )}
              >
                Explore services
              </Link>
            </div>
          </div>
          <div
            className="relative hidden h-[120px] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-muted/40 via-background/80 to-primary/[0.06] ring-1 ring-border/40 sm:block lg:h-[140px]"
            aria-hidden
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-[4.5rem] items-center justify-center rounded-2xl border border-primary/12 bg-primary/[0.08] proto-dash-empty-shimmer">
                <Sparkles className="size-8 text-primary/70" strokeWidth={1.25} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={customerSectionClass({ priority: "emphasis" })}>
        <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Quick actions</h2>
        <div className="mt-2.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {(
            [
              { kind: "link" as const, icon: CalendarDays, label: "Book a visit", href: "/prototype/booking" },
              { kind: "action" as const, icon: MapPin, label: "Save address", tab: "preferences" as const },
              { kind: "action" as const, icon: SlidersHorizontal, label: "Preferences", tab: "preferences" as const },
              { kind: "link" as const, icon: Repeat2, label: "Recurring", href: "/prototype/booking" },
            ] as const
          ).map((a) => {
            const cardClass = cn(
              "snap-start flex min-w-[42%] shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2 text-left motion-safe:transition-[transform,box-shadow,background-color,border-color] motion-safe:duration-200 min-[400px]:min-w-0 sm:min-w-0 sm:flex-1",
              "hover:border-primary/25 hover:bg-background/80 hover:shadow-sm active:scale-[0.99]",
            );
            const inner = (
              <>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <a.icon className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-[13px] font-medium text-foreground">{a.label}</span>
              </>
            );
            if (a.kind === "link") {
              return (
                <Link key={a.label} href={a.href} className={cardClass}>
                  {inner}
                </Link>
              );
            }
            return (
              <button key={a.label} type="button" onClick={() => navigate(a.tab)} className={cardClass}>
                {inner}
              </button>
            );
          })}
        </div>
      </section>

      <section className={customerSectionClass({ priority: "default" })} aria-labelledby="dash-onboard-journey">
        <h2 id="dash-onboard-journey" className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>
          How it works
        </h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Your first visits, step by step</p>
        <ol className="mt-3 flex flex-wrap gap-2">
          {ONBOARDING_STEPS.map((label, i) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/25 px-2.5 py-1 text-[11px] font-medium text-foreground"
            >
              <span className="tabular-nums text-muted-foreground">{i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </section>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Visits</h2>
          <button
            type="button"
            onClick={() => navigate("visits")}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary motion-safe:transition-colors hover:text-primary/85"
          >
            Open
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
        {hasPast ? (
          <ul className="mt-2.5 space-y-2">
            {previewPast.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => openDetail({ kind: "rebookPast", pastId: b.id })}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/[0.15] px-3 py-2.5 text-left motion-safe:transition-[border-color,box-shadow,transform] motion-safe:duration-200 hover:-translate-y-px hover:border-primary/12 hover:shadow-sm"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-foreground">{b.serviceLabel}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {b.dateLabel} · {b.areaLabel}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2.5 rounded-xl border border-dashed border-border/70 bg-muted/[0.1] px-4 py-4 text-center sm:px-5">
            <p className="text-[14px] font-medium text-foreground">No visits yet</p>
            <p className="mx-auto mt-0.5 max-w-sm text-[12px] text-muted-foreground">Completed visits will appear here.</p>
            <Link
              href="/prototype/booking"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-3 inline-flex rounded-xl")}
            >
              Book your first clean
            </Link>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {SERVICE_LABELS.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border/55 bg-background/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
