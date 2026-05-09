import { cn } from "@/lib/utils";

import { customerSectionClass } from "./customer-dashboard-ui";

export type CleanerNavTab = "home" | "schedule" | "active" | "earnings" | "availability" | "messages";

/** Same premium card shells as customer prototype. */
export const cleanerSectionClass = customerSectionClass;

export function cleanerHeroTitle(className?: string) {
  return cn(
    "booking-display text-[1.35rem] font-normal leading-[1.2] tracking-[-0.01em] text-foreground sm:text-[1.5rem]",
    className,
  );
}
