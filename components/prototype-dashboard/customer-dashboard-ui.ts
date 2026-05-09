import { cn } from "@/lib/utils";

export type CustomerNavTab = "dashboard" | "visits" | "messages" | "payments" | "preferences";

export function customerSectionClass({
  className,
  priority = "default",
}: {
  className?: string;
  priority?: "hero" | "emphasis" | "default" | "quiet";
}) {
  return cn(
    "rounded-2xl ring-1 motion-safe:transition-[box-shadow,transform,border-color] motion-safe:duration-300",
    priority === "hero" &&
      "bg-gradient-to-br from-primary/[0.09] via-card to-card p-5 shadow-[0_4px_32px_-18px_rgba(53,99,255,0.22)] ring-primary/15 sm:p-6 md:p-7 motion-safe:hover:shadow-[0_8px_40px_-20px_rgba(53,99,255,0.28)]",
    priority === "emphasis" &&
      "bg-card p-4 shadow-[0_2px_16px_-12px_rgba(53,99,255,0.12)] ring-border sm:p-5 motion-safe:hover:-translate-y-px motion-safe:hover:shadow-[0_8px_28px_-16px_rgba(53,99,255,0.14)]",
    priority === "default" &&
      "bg-card/90 p-4 shadow-[0_1px_4px_rgba(28,36,48,0.04)] ring-border/90 sm:p-5 motion-safe:hover:-translate-y-px motion-safe:hover:shadow-[0_8px_28px_-14px_rgba(53,99,255,0.12)] motion-safe:hover:ring-primary/10",
    priority === "quiet" && "bg-muted/[0.35] p-4 ring-border/70 sm:p-4",
    className,
  );
}
