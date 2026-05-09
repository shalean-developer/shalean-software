import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StrategicOperationalSummary } from "@/lib/analytics/strategic-intelligence";

export function StrategicSummaryCard({ summary }: { summary: StrategicOperationalSummary }) {
  return (
    <Card id="stage17-strategic" className="scroll-mt-24 border-border/80 bg-muted/[0.04]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Strategic operational summary</CardTitle>
        <CardDescription>
          Interpretive only — compares halves of the trend window and pairs absolute signals. No forecasting models.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="font-medium leading-relaxed text-foreground">{summary.maturity_headline}</p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trend shape</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-muted-foreground">
            {summary.interpretive_bullets.map((line, i) => (
              <li key={`interp-${i}`}>{line}</li>
            ))}
          </ul>
        </div>
        {summary.throughput_notes.length > 0 ? (
          <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Throughput / saturation</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              {summary.throughput_notes.map((line, i) => (
                <li key={`thr-${i}`}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>
            Export JSON:{" "}
            <Link href="/api/admin/export/analytics" className="font-medium text-primary underline-offset-4 hover:underline">
              analytics
            </Link>
          </span>
          <span>
            Export CSV:{" "}
            <Link
              href="/api/admin/export/analytics?format=csv"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              analytics
            </Link>
          </span>
          <span>
            Monitoring JSON:{" "}
            <Link href="/api/admin/export/monitoring" className="font-medium text-primary underline-offset-4 hover:underline">
              snapshot
            </Link>
          </span>
          <span>
            Monitoring CSV:{" "}
            <Link
              href="/api/admin/export/monitoring?format=csv"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              snapshot
            </Link>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
