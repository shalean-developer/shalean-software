import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFERRED_MAINTENANCE_ITEMS } from "@/lib/operational/sustainability/deferred-maintenance";

/** Visible technical-debt inventory — calm governance, not alerts (Stage 17). */
export function SustainabilityMaintenanceCard() {
  return (
    <Card id="stage17-sustainability" className="scroll-mt-24">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Platform sustainability notes</CardTitle>
        <CardDescription>
          Prioritized cleanup backlog — update the list when retiring diagnostics or shipping metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Narratives:{" "}
          <span className="font-mono text-xs text-foreground">docs/stage-17-platform-optimization.md</span>
          {" · "}
          <span className="font-mono text-xs text-foreground">docs/stage-18-ecosystem-consolidation.md</span>
          {" · "}
          <span className="font-mono text-xs text-foreground">docs/stage-19-operational-scale-governance.md</span>
          {" · "}
          <span className="font-mono text-xs text-foreground">docs/stage-20-production-stewardship.md</span>
          {" · "}
          <span className="font-mono text-xs text-foreground">docs/OPERATIONAL-ONBOARDING.md</span>
        </p>
        <ul className="list-inside list-disc space-y-2">
          {DEFERRED_MAINTENANCE_ITEMS.map((item) => (
            <li key={item.id}>
              <span className="font-medium text-foreground">{item.area}:</span> {item.note}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
