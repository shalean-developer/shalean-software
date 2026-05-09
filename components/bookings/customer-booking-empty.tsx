import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "muted" | "positive";

export function CustomerBookingEmpty({
  title,
  description,
  actionHref,
  actionLabel,
  tone = "muted",
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-8 text-center sm:px-6",
        tone === "positive"
          ? "border-emerald-600/25 bg-emerald-500/5"
          : "border-dashed border-border/80 bg-muted/15",
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={cn(buttonVariants({ variant: tone === "positive" ? "outline" : "default" }), "mt-5 inline-flex touch-manipulation")}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
