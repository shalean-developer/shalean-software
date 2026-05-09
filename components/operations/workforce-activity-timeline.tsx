"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { customerBookingEventSubtitle, customerBookingEventTitle } from "@/lib/bookings/customer-flow/event-copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WorkforceActivityEvent = {
  id: string;
  event_type: string;
  created_at: string;
  payload: unknown;
  actor_user_id?: string | null;
};

function formatDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function groupByDay(events: WorkforceActivityEvent[]) {
  const groups: { dayKey: string; dayLabel: string; items: WorkforceActivityEvent[] }[] = [];
  for (const e of events) {
    const d = new Date(e.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const dayLabel = formatDay(e.created_at);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === dayKey) last.items.push(e);
    else groups.push({ dayKey, dayLabel, items: [e] });
  }
  return groups;
}

type WorkforceActivityTimelineProps = {
  events: WorkforceActivityEvent[];
  /** Admin sees payload expansion; cleaner sees shorter copy. */
  variant: "cleaner" | "admin";
};

export function WorkforceActivityTimeline({ events, variant }: WorkforceActivityTimelineProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const groups = useMemo(() => groupByDay(events), [events]);

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No lifecycle events recorded yet — they appear when booking status changes.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.dayKey}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.dayLabel}</p>
          <ul className="space-y-0">
            {group.items.map((e, idx) => {
              const expanded = openId === e.id;
              const title = customerBookingEventTitle(e.event_type);
              const subtitle = customerBookingEventSubtitle(e.event_type);
              const payloadStr = JSON.stringify(e.payload, null, 2);
              const hasNext = idx < group.items.length - 1;

              return (
                <li key={e.id} className="relative flex gap-3">
                  <div className="flex w-5 shrink-0 flex-col items-center pt-1">
                    <span
                      className="relative z-[1] size-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_0_3px_var(--background)] ring-1 ring-border"
                      aria-hidden
                    />
                    {hasNext ? <span className="mt-1 min-h-[2.5rem] w-px flex-1 bg-border" aria-hidden /> : null}
                  </div>
                  <div className={cn("min-w-0 flex-1 pb-6", !hasNext && "pb-1")}>
                    <div className="rounded-lg border border-border/70 bg-muted/10 px-3 py-2.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{title}</p>
                        <time className="text-[11px] tabular-nums text-muted-foreground">{formatTime(e.created_at)}</time>
                      </div>
                      {subtitle ? (
                        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                      ) : null}
                      {variant === "admin" ? (
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                          Actor:{" "}
                          {e.actor_user_id ? (
                            <span title={e.actor_user_id}>{e.actor_user_id.slice(0, 8)}…</span>
                          ) : (
                            <span title="Emitted by database lifecycle trigger">system/trigger</span>
                          )}
                        </p>
                      ) : null}
                      {variant === "admin" ? (
                        <div className="mt-2 border-t border-border/50 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto gap-1 px-0 py-0 text-[11px] font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                            onClick={() => setOpenId(expanded ? null : e.id)}
                            aria-expanded={expanded}
                          >
                            <ChevronDown className={cn("size-3 transition-transform", expanded && "rotate-180")} aria-hidden />
                            {expanded ? "Hide payload" : "Payload"}
                          </Button>
                          {expanded ? (
                            <pre className="mt-2 max-h-36 overflow-auto rounded-md bg-muted/50 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                              {payloadStr}
                            </pre>
                          ) : null}
                        </div>
                      ) : null}
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
