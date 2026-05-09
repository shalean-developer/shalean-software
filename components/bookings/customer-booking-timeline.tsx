"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import type { CustomerBookingEventRow } from "@/lib/bookings/customer-flow";
import { customerBookingEventSubtitle, customerBookingEventTitle } from "@/lib/bookings/customer-flow/event-copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatAt(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function groupEventsByDay(events: CustomerBookingEventRow[]) {
  const groups: { dayKey: string; dayLabel: string; items: CustomerBookingEventRow[] }[] = [];
  for (const e of events) {
    const d = new Date(e.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const dayLabel = d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const last = groups[groups.length - 1];
    if (last && last.dayKey === dayKey) {
      last.items.push(e);
    } else {
      groups.push({ dayKey, dayLabel, items: [e] });
    }
  }
  return groups;
}

export function CustomerBookingTimeline({ events }: { events: CustomerBookingEventRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const groups = useMemo(() => groupEventsByDay(events), [events]);

  if (events.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Updates appear here in order — usually within seconds when payment clears, a cleaner is assigned, or service
        milestones change. Refresh if you just finished checkout.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.dayKey} aria-label={group.dayLabel}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.dayLabel}</p>
          <ul className="space-y-0">
            {group.items.map((e, idx) => {
              const expanded = openId === e.id;
              const title = customerBookingEventTitle(e.event_type);
              const subtitle = customerBookingEventSubtitle(e.event_type);
              const payloadStr = JSON.stringify(e.payload, null, 2);
              const hasNextInDay = idx < group.items.length - 1;

              return (
                <li key={e.id} className="relative flex gap-4">
                  <div className="flex w-5 shrink-0 flex-col items-center pt-1">
                    <span
                      className="relative z-[1] size-3 shrink-0 rounded-full bg-primary shadow-[0_0_0_4px_var(--background)] ring-1 ring-border"
                      aria-hidden
                    />
                    {hasNextInDay ? <span className="mt-1 min-h-[3rem] w-px flex-1 bg-border" aria-hidden /> : null}
                  </div>
                  <div className={cn("min-w-0 flex-1 pb-8", !hasNextInDay && "pb-2")}>
                    <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3 shadow-xs">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="font-medium leading-snug">{title}</p>
                        <time className="text-xs tabular-nums text-muted-foreground">{formatAt(e.created_at)}</time>
                      </div>
                      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
                      <div className="mt-3 border-t border-border/60 pt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto gap-1 px-0 py-0 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                          onClick={() => setOpenId(expanded ? null : e.id)}
                          aria-expanded={expanded}
                        >
                          <ChevronDown
                            className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                            aria-hidden
                          />
                          {expanded ? "Hide support details" : "Details for support"}
                        </Button>
                        {expanded ? (
                          <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted/40 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                            {payloadStr}
                          </pre>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
