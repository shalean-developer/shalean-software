import { OperationalHubNav } from "@/components/admin/operational-hub-nav";
import { OperationalHintsList } from "@/components/admin/operational-hints-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  OPERATIONAL_AUTOMATION_BOUNDARIES,
  RECOMMENDATION_APPROVAL_PATTERN,
  loadOperationalDigest,
} from "@/lib/operational/assistance";
import { OPERATIONAL_DIGEST_SOURCE_COPY } from "@/lib/operational/consolidation";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function OperationalDigestPage() {
  const client = await createServerSupabaseClient();
  const digest = await loadOperationalDigest(client);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="space-y-2 border-b border-border/60 pb-6">
        <OperationalHubNav current="digest" />
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Daily operational digest</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {OPERATIONAL_DIGEST_SOURCE_COPY} Generated{" "}
          <span className="font-mono text-xs">{digest.generated_at}</span>
        </p>
        {!digest.analytics_ok ? (
          <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
            Analytics partially unavailable: {digest.analytics_message ?? "unknown error"} — queue hints only below.
          </p>
        ) : null}
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Workload summary</CardTitle>
          <CardDescription>Funnel window from analytics snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">{digest.workload_summary}</CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Priorities</CardTitle>
          <CardDescription>Merge of queue intelligence and SLA-style flags.</CardDescription>
        </CardHeader>
        <CardContent>
          {digest.priorities.length > 0 ? (
            <OperationalHintsList hints={digest.priorities} heading={undefined} />
          ) : (
            <p className="text-sm text-muted-foreground">No priority hints right now — queues look calm.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Queue health</CardTitle>
            <CardDescription>Aging and stall counts (funnel window).</CardDescription>
          </CardHeader>
          <CardContent>
            {digest.queue_health.length > 0 ? (
              <OperationalHintsList hints={digest.queue_health} heading={undefined} />
            ) : (
              <p className="text-sm text-muted-foreground">No elevated ops-health signals in window.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Incidents & anomalies</CardTitle>
            <CardDescription>Cluster-style hints from SLA surfaces and payment shape.</CardDescription>
          </CardHeader>
          <CardContent>
            {digest.incident_summary.length > 0 ? (
              <OperationalHintsList hints={digest.incident_summary} heading={undefined} />
            ) : (
              <p className="text-sm text-muted-foreground">No incident clustering surfaced — continue routine monitoring.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-muted/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Automation readiness — boundaries</CardTitle>
          <CardDescription>
            Human authority preserved; patterns for future recommendation → approval (no autonomous lifecycle).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-foreground">Recommendation / approval pattern</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              <li>Surface: {RECOMMENDATION_APPROVAL_PATTERN.surface}</li>
              <li>Approval: {RECOMMENDATION_APPROVAL_PATTERN.approval}</li>
              <li>Audit: {RECOMMENDATION_APPROVAL_PATTERN.audit}</li>
              <li>Traceability: {RECOMMENDATION_APPROVAL_PATTERN.traceability}</li>
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">Future automatable (with explicit approval)</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                {OPERATIONAL_AUTOMATION_BOUNDARIES.futureAutomatableWithApproval.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Must stay human-controlled</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                {OPERATIONAL_AUTOMATION_BOUNDARIES.humanControlled.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">Lifecycle safety</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                {OPERATIONAL_AUTOMATION_BOUNDARIES.lifecycleSafety.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Financial safety</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                {OPERATIONAL_AUTOMATION_BOUNDARIES.financialSafety.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
