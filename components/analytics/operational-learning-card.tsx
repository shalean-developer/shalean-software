import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GOVERNANCE_REVIEW_CHECKLIST,
  OPERATIONAL_EVOLUTION_PRINCIPLES,
  SAFE_CHANGE_REMINDERS,
  type OperationalLearningSignal,
} from "@/lib/operational/evolution";

export function OperationalLearningCard({ signals }: { signals: OperationalLearningSignal[] }) {
  return (
    <Card id="stage19-learning" className="scroll-mt-24 border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Operational learning and evolution context</CardTitle>
        <CardDescription>
          Interpretive cues from this snapshot — pair with Monitoring drill-through and team notes. No predictive models or
          parallel metrics stores.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ul className="space-y-3">
          {signals.map((sig) => (
            <li
              key={sig.id}
              className={
                sig.attention === "attention"
                  ? "rounded-lg border border-amber-600/25 bg-amber-500/[0.06] px-3 py-2 dark:border-amber-500/20"
                  : "rounded-lg border border-border/60 bg-muted/10 px-3 py-2"
              }
            >
              <p className="font-medium text-foreground">{sig.title}</p>
              <p className="mt-1 text-muted-foreground">{sig.detail}</p>
            </li>
          ))}
        </ul>

        <details className="rounded-lg border border-border/70 bg-card/40 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Governance review and safe-change reminders
          </summary>
          <div className="mt-3 space-y-4 text-muted-foreground">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evolution principles</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {OPERATIONAL_EVOLUTION_PRINCIPLES.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Governance checklist</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {GOVERNANCE_REVIEW_CHECKLIST.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Safe change</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {SAFE_CHANGE_REMINDERS.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs">
              Full roadmap:{" "}
              <span className="font-mono text-foreground">docs/stage-19-operational-scale-governance.md</span>
              {" · "}
              <Link href="/admin/support" className="font-medium text-primary underline-offset-4 hover:underline">
                Support hub
              </Link>
            </p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
