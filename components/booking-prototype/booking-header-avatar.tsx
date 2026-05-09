"use client";

import { User } from "lucide-react";

import { cn } from "@/lib/utils";

/** Minimal guest avatar for booking header — prototype placeholder (no auth). */
export function BookingHeaderAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
        "shadow-[0_1px_3px_rgba(53,99,255,0.07)] ring-1 ring-border",
        "sm:size-9",
        className,
      )}
      title="Guest"
    >
      <User className="size-[14px] opacity-[0.88] stroke-[1.5] sm:size-[15px]" aria-hidden />
      <span className="sr-only">Guest</span>
      <span
        className="absolute -bottom-px -right-px size-2 rounded-full bg-[color:var(--booking-success)] ring-[2px] ring-background"
        aria-hidden
      />
    </div>
  );
}
