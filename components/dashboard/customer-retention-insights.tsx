import Link from "next/link";
import { HeartHandshake, Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomerRetentionInsights } from "@/lib/bookings/customer-flow";

function cadenceLine(insights: CustomerRetentionInsights): string | null {
  if (insights.median_days_between_completions === null || insights.cadence_sample_size < 2) {
    return null;
  }
  const d = Math.round(insights.median_days_between_completions * 10) / 10;
  return `Typical gap between completed visits (recent sample): about ${d} days — informational only.`;
}

export function CustomerRetentionInsightsCard({
  insights,
}: {
  insights: CustomerRetentionInsights;
}) {
  if (insights.total_bookings === 0) {
    return null;
  }

  const cadence = cadenceLine(insights);
  const trust =
    insights.trust_tier === "frequent"
      ? "You have a strong history of completed cleans with us — thank you for trusting Shalean."
      : insights.trust_tier === "returning"
        ? "Thanks for coming back — each visit follows the same governed lifecycle you see in My bookings."
        : "After your first completed visit, summaries like cadence and history will appear here.";

  return (
    <Card className="border-border/80 bg-card/60">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HeartHandshake className="size-4" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-base">Your service relationship</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-1.5">
              <Info className="size-3.5 shrink-0" aria-hidden />
              <span>Insights from your bookings only — not billing or marketing automation.</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="text-foreground">{trust}</p>
        <ul className="list-inside list-disc space-y-1.5">
          <li>
            <span className="text-muted-foreground">Completed visits:</span>{" "}
            <span className="font-mono text-foreground">{insights.completed_bookings}</span>
            {insights.is_repeat_customer ? (
              <span className="ml-1 text-emerald-800 dark:text-emerald-200">· repeat customer</span>
            ) : null}
          </li>
          {insights.days_since_last_completion !== null ? (
            <li>
              <span className="text-muted-foreground">Days since last completion:</span>{" "}
              <span className="font-mono text-foreground">{insights.days_since_last_completion}</span>
            </li>
          ) : null}
          {cadence ? <li>{cadence}</li> : null}
        </ul>
        {insights.inactive_reengagement_hint ? (
          <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs leading-relaxed">
            It has been a while since your last completed visit. When you are ready,{" "}
            <Link href="/bookings/new" className="font-medium text-primary underline-offset-4 hover:underline">
              book a new clean
            </Link>{" "}
            — we will not send extra prompts beyond normal operational updates.
          </p>
        ) : null}
        <p className="text-xs leading-relaxed">
          Recurring schedules are not auto-run yet; you always confirm each booking and payment through the standard flow.
        </p>
      </CardContent>
    </Card>
  );
}
