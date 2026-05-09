import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OPERATIONAL_DURABILITY_PRINCIPLES } from "@/lib/operational/consolidation";
import {
  ARCHITECTURAL_STEWARDSHIP_GUARDRAILS,
  GOVERNANCE_RATIONALE_SNIPPETS,
  LONG_HORIZON_RESILIENCE_REMINDERS,
  OPERATIONAL_MATURITY_CHECKPOINTS,
  ORGANIZATIONAL_CONTINUITY_GUIDANCE,
  PRODUCTION_STEWARDSHIP_REMINDERS,
  STRATEGIC_SIMPLICITY_GOVERNANCE,
  type StewardshipPostureCue,
} from "@/lib/operational/stewardship";

export function OperationalStewardshipCard({ cues }: { cues: StewardshipPostureCue[] }) {
  return (
    <Card id="stage20-stewardship" className="scroll-mt-24 border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Production stewardship and continuity</CardTitle>
        <CardDescription>
          Snapshot stewardship cues plus durable governance language — informational only. No parallel operational store;
          pair with Learning and Sustainability cards.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ul className="space-y-3">
          {cues.map((cue) => (
            <li
              key={cue.id}
              className={
                cue.attention === "watch"
                  ? "rounded-lg border border-amber-600/25 bg-amber-500/[0.06] px-3 py-2 dark:border-amber-500/20"
                  : "rounded-lg border border-emerald-800/15 bg-emerald-500/[0.04] px-3 py-2 dark:border-emerald-500/15"
              }
            >
              <p className="font-medium text-foreground">{cue.title}</p>
              <p className="mt-1 text-muted-foreground">{cue.detail}</p>
            </li>
          ))}
        </ul>

        <details className="rounded-lg border border-border/70 bg-card/40 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Stewardship principles, rationale, and checkpoints
          </summary>
          <div className="mt-3 space-y-4 text-muted-foreground">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Production stewardship
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {PRODUCTION_STEWARDSHIP_REMINDERS.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Durability principles (shared)
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {OPERATIONAL_DURABILITY_PRINCIPLES.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Architectural guardrails
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {ARCHITECTURAL_STEWARDSHIP_GUARDRAILS.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why these governance rules exist
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {GOVERNANCE_RATIONALE_SNIPPETS.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Long-horizon resilience
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {LONG_HORIZON_RESILIENCE_REMINDERS.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Organizational continuity
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {ORGANIZATIONAL_CONTINUITY_GUIDANCE.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Maturity checkpoints
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {OPERATIONAL_MATURITY_CHECKPOINTS.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Strategic simplicity
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {STRATEGIC_SIMPLICITY_GOVERNANCE.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs">
              Full stewardship narrative:{" "}
              <span className="font-mono text-foreground">docs/stage-20-production-stewardship.md</span>
              {" · "}
              <Link href="/admin/monitoring" className="font-medium text-primary underline-offset-4 hover:underline">
                Monitoring
              </Link>
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
