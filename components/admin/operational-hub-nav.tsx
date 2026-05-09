import Link from "next/link";

import {
  OPERATIONAL_HUB_LINKS,
  type OperationalHubSurface,
} from "@/lib/operational/consolidation";
import { cn } from "@/lib/utils";

type OperationalHubNavProps = {
  /** Highlights current surface for keyboard/screen-reader continuity */
  current?: OperationalHubSurface;
  className?: string;
};

/**
 * Cross-surface operational navigation — consistent drill-through (Stage 18).
 */
export function OperationalHubNav({ current, className }: OperationalHubNavProps) {
  return (
    <nav aria-label="Operational hub" className={cn("flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}>
      {OPERATIONAL_HUB_LINKS.map((l) => {
        const isCurrent = current === l.id;
        return (
          <Link
            key={l.id}
            prefetch={false}
            href={l.href}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              "underline-offset-4 hover:underline",
              isCurrent ? "font-semibold text-foreground no-underline" : "",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
