"use client";

import Link from "next/link";
import { Briefcase, LayoutDashboard, Sparkles, UserRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bp, bpHint, bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

const DASHBOARDS = [
  {
    slug: "customer",
    title: "Customer dashboard",
    description: "Visits, preferences, and payments after booking — mock data only.",
    icon: UserRound,
    status: "Active",
    statusVariant: "active" as const,
    href: "/prototype/customer",
    cta: "Open",
  },
  {
    slug: "admin",
    title: "Admin dashboard",
    description: "Operations control center — bookings, dispatch, cleaners, earnings — mock data only.",
    icon: LayoutDashboard,
    status: "Active",
    statusVariant: "active" as const,
    href: "/prototype/admin",
    cta: "Open",
  },
  {
    slug: "cleaner",
    title: "Cleaner dashboard",
    description: "Field companion — schedule, active visit, earnings, and availability — mock data only.",
    icon: Briefcase,
    status: "Active",
    statusVariant: "active" as const,
    href: "/prototype/cleaner",
    cta: "Open",
  },
] as const;

function StatusPill({ variant, children }: { variant: "active" | "soon"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        variant === "active" && "border-primary/30 bg-primary/[0.1] text-primary",
        variant === "soon" && "border-border/80 bg-muted/40 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function PrototypeHubView() {
  return (
    <div className={cn(bp.pageRoot, "min-h-full")}>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className={bpOverline}>Shalean prototype</p>
            <h1 className={cn(bp.heroTitle, "mt-2")}>Operational dashboards</h1>
            <p className={cn(bp.heroSubtitle, "mt-3")}>
              Central hub for previewing customer, admin, and cleaner experiences before backend wiring.
            </p>
          </div>
          <Link
            href="/prototype/booking"
            className={cn(buttonVariants({ size: "sm" }), "inline-flex shrink-0 items-center gap-2 rounded-xl")}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Booking flow
          </Link>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARDS.map((d) => (
            <li key={d.slug} className={cn(bp.section, "flex flex-col p-5 sm:p-6")}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <d.icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <StatusPill variant={d.statusVariant}>{d.status}</StatusPill>
              </div>
              <h2 className={cn(bpSectionHeading, "booking-display mt-4 text-[1.1rem]")}>{d.title}</h2>
              <p className={cn(bpHint, "mt-2 flex-1")}>{d.description}</p>
              <div className="mt-5">
                <Link href={d.href} className={cn(buttonVariants({ variant: d.statusVariant === "active" ? "default" : "outline" }), "w-full rounded-xl")}>
                  {d.cta}
                  <span className="sr-only"> — {d.title}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
