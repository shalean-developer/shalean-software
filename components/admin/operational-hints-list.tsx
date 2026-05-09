import type { OperationalHint } from "@/lib/operational/assistance/types";
import { cn } from "@/lib/utils";

function severityLabel(s: OperationalHint["severity"]): string {
  switch (s) {
    case "priority":
      return "Review soon";
    case "attention":
      return "Heads-up";
    default:
      return "Context";
  }
}

function severityStyles(s: OperationalHint["severity"]): string {
  switch (s) {
    case "priority":
      return "border-l-amber-600 bg-amber-500/[0.06] dark:border-l-amber-400";
    case "attention":
      return "border-l-amber-500/70 bg-muted/25 dark:border-l-amber-500/50";
    default:
      return "border-l-border bg-muted/10";
  }
}

export function OperationalHintsList(props: {
  hints: OperationalHint[];
  density?: "default" | "compact";
  heading?: string;
}) {
  if (props.hints.length === 0) return null;
  const compact = props.density === "compact";

  return (
    <div className={cn("space-y-2", compact ? "" : "space-y-3")}>
      {props.heading ? (
        <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>{props.heading}</p>
      ) : null}
      <ul className={cn("space-y-2", compact ? "text-xs" : "text-sm")}>
        {props.hints.map((h) => (
          <li
            key={h.id}
            className={cn(
              "rounded-lg border border-border/60 border-l-4 py-2 pl-3 pr-2 leading-relaxed",
              severityStyles(h.severity),
              compact ? "py-1.5" : "py-2.5",
            )}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {severityLabel(h.severity)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{h.category}</span>
            </div>
            <p className="mt-1 font-medium text-foreground">{h.title}</p>
            <p className="mt-0.5 text-muted-foreground">{h.detail}</p>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground">
        Assistance is informational — actions use existing lifecycle controls only.
      </p>
    </div>
  );
}
