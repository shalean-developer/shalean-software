"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ChecklistItem } from "./mock-cleaner-data";
import { cleanerSectionClass } from "./cleaner-dashboard-ui";

export function CleanerChecklistCards({
  items,
  onToggle,
}: {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onToggle(item.id)}
            className={cn(
              cleanerSectionClass({ priority: "default" }),
              "flex w-full items-center gap-3 rounded-xl p-3.5 text-left motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:active:scale-[0.99] sm:p-4",
              item.done && "bg-primary/[0.06] ring-primary/20",
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 motion-safe:transition-colors motion-safe:duration-200",
                item.done
                  ? "bg-primary text-primary-foreground ring-primary/30"
                  : "bg-muted/40 ring-border/80 text-transparent",
              )}
              aria-hidden
            >
              <Check className="size-5 stroke-[2.5]" />
            </span>
            <span className={cn("min-w-0 text-[14px] font-medium leading-snug", item.done && "text-muted-foreground line-through decoration-border")}>
              {item.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
