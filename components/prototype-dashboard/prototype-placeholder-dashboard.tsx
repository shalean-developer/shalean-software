"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bp, bpHint, bpOverline } from "@/components/booking-prototype/visual-system";

export function PrototypePlaceholderDashboard({
  title,
  lead,
}: {
  title: string;
  lead: string;
}) {
  return (
    <div className={cn(bp.pageRoot, "min-h-full")}>
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/prototype"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-6 gap-1.5 rounded-xl text-muted-foreground")}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Hub
        </Link>
        <p className={bpOverline}>Prototype</p>
        <h1 className={cn(bp.heroTitle, "booking-display mt-2 text-[1.65rem]")}>{title}</h1>
        <p className={cn(bpHint, "mt-3")}>{lead}</p>
        <div className={cn(bp.section, "mt-8 p-6 text-center")}>
          <p className="text-[14px] font-medium text-foreground">Coming soon</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Placeholder route — customer dashboard ships first.</p>
          <Link
            href="/prototype/customer"
            className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex w-full justify-center rounded-xl sm:w-auto")}
          >
            View customer dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
