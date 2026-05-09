"use client";

import { Inter, Playfair_Display } from "next/font/google";

import { SharedWorkflowProvider } from "@/components/prototype-dashboard/shared-workflow-store";
import { cn } from "@/lib/utils";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-booking-display",
  display: "swap",
});

const ui = Inter({
  subsets: ["latin"],
  variable: "--font-booking-ui",
  display: "swap",
});

/**
 * Shared Shalean prototype chrome: Inter + Playfair + `.booking-flow-brand` tokens
 * (see `app/globals.css`). Use under `/prototype/*` for visual parity with booking.
 *
 * Also mounts the cross-system shared workflow store so booking flow, customer,
 * cleaner, and admin prototypes all read from one canonical lifecycle source.
 */
export function PrototypeRealmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(display.variable, ui.variable, "booking-flow-brand min-h-full")}>
      <SharedWorkflowProvider>{children}</SharedWorkflowProvider>
    </div>
  );
}
