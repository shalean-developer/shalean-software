"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertOctagon,
  Bell,
  CalendarClock,
  CheckCircle2,
  Inbox,
  MessageCircle,
  Pencil,
  Phone,
  Send,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import {
  type AdminSupportThread,
} from "../mock-admin-data";
import { adminChipClass, adminSectionClass, type AdminChipVariant } from "../admin-dashboard-ui";
import { useAdminWorkflow } from "../admin-workflow-context";

const LANES: { id: "all" | "support" | "cleaner" | "alerts"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "support", label: "Customer support" },
  { id: "cleaner", label: "Cleaner desk" },
  { id: "alerts", label: "Alerts" },
];

const PRIORITY_TONE: Record<AdminSupportThread["priority"], AdminChipVariant> = {
  high: "alert",
  med: "warn",
  low: "muted",
};

const CHANNEL_LABEL: Record<AdminSupportThread["channel"], string> = {
  chat: "Chat",
  email: "Email",
  whatsapp: "WhatsApp",
};

const QUICK_REPLIES = [
  "Looking into it now.",
  "ETA shared with customer.",
  "Updated booking — confirming on email.",
  "Thanks for the patience — wrapping it up.",
];

export function AdminMessagesView() {
  const {
    state,
    setMessageLane,
    openThread,
    sendThreadReply,
    escalateThread,
    resolveThread,
    pushToast,
  } = useAdminWorkflow();

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const lane = state.messageLane;
  const allThreads = useMemo(() => Object.values(state.threads), [state.threads]);
  const threads = lane === "alerts" || lane === "cleaner" ? [] : allThreads;
  const active = state.threads[state.activeThreadId];
  const unread = allThreads.filter((t) => t.unread && !t.resolved).length;
  const escalations = allThreads.filter((t) => t.escalated || t.priority === "high").length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active?.messages.length, state.typingThreadId]);

  const handleSend = () => {
    if (!active) return;
    if (!draft.trim()) return;
    sendThreadReply(active.id, draft.trim());
    setDraft("");
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Messages</p>
          <h1 className="booking-display mt-1 text-[1.4rem] font-normal tracking-tight text-foreground sm:text-[1.55rem]">
            Communication hub
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Customer support, cleaner desk, and alerts in one queue.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={adminChipClass("muted")}>{unread} unread</span>
          {escalations > 0 ? <span className={adminChipClass("alert")}>{escalations} escalation{escalations === 1 ? "" : "s"}</span> : null}
        </div>
      </div>

      <section className={cn(adminSectionClass({ priority: "default" }), "p-3 sm:p-4")}>
        <div className="flex flex-wrap gap-1.5">
          {LANES.map((l) => {
            const on = lane === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setMessageLane(l.id)}
                aria-pressed={on}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 motion-safe:transition-[background-color,color,box-shadow] motion-safe:duration-200",
                  on
                    ? "bg-primary/[0.1] text-primary ring-primary/30 shadow-[0_2px_8px_-4px_rgba(53,99,255,0.28)]"
                    : "bg-card text-muted-foreground ring-border/70 hover:bg-muted/45 hover:text-foreground hover:ring-primary/20",
                )}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={cn(adminSectionClass({ priority: "default" }), "p-0 overflow-hidden")}>
          <div className="border-b border-border/55 px-4 py-2.5">
            <h2 className={cn(bpSectionHeading, "flex items-center gap-2 text-[14px]")}>
              <Inbox className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
              Threads
            </h2>
          </div>
          {threads.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-[13px] font-medium text-foreground">No threads in this lane yet</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Switch to &ldquo;All&rdquo; or &ldquo;Customer support&rdquo; to triage.
              </p>
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-border/55 overflow-y-auto">
              {threads.map((t) => {
                const on = t.id === state.activeThreadId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => openThread(t.id)}
                      aria-pressed={on}
                      className={cn(
                        "flex w-full items-start gap-2.5 px-4 py-3 text-left motion-safe:transition-[background-color] motion-safe:duration-200",
                        on ? "bg-primary/[0.06]" : "hover:bg-muted/40",
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-[12px] font-semibold text-primary">
                        {t.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="text-[13px] font-medium leading-tight text-foreground">{t.subject}</p>
                          {t.unread ? <span className="size-1.5 rounded-full bg-primary" aria-hidden /> : null}
                          {t.escalated ? (
                            <span className={adminChipClass("alert", "px-1.5 py-0 text-[9px]")}>Escalated</span>
                          ) : null}
                          {t.resolved ? (
                            <span className={adminChipClass("success", "px-1.5 py-0 text-[9px]")}>Resolved</span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">{t.customerName}</p>
                        <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">{t.preview}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[10.5px] font-medium tabular-nums text-muted-foreground">{t.timeLabel}</span>
                        <span className={adminChipClass(PRIORITY_TONE[t.priority], "px-1.5 py-0.5 text-[9.5px]")}>
                          {t.priority === "high" ? "Priority" : CHANNEL_LABEL[t.channel]}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-3">
          {active ? (
            <section className={cn(adminSectionClass({ priority: "emphasis" }))}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-[13px] font-semibold text-primary">
                    {active.initials}
                  </span>
                  <div className="min-w-0">
                    <p className={cn(bpSectionHeading, "text-[14.5px]")}>{active.subject}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {active.customerName} · {CHANNEL_LABEL[active.channel]}
                    </p>
                  </div>
                </div>
                <span className={adminChipClass(active.escalated ? "alert" : PRIORITY_TONE[active.priority])}>
                  {active.escalated
                    ? "Escalated"
                    : active.priority === "high"
                      ? "High priority"
                      : active.priority === "med"
                        ? "Standard"
                        : "Low"}
                </span>
              </div>

              <div className="mt-3 max-h-[40vh] space-y-2 overflow-y-auto rounded-2xl bg-background/70 p-3 ring-1 ring-border/55">
                {active.messages.map((m) => (
                  <div key={m.id} className={cn("flex w-full", m.authorRole === "ops" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug ring-1",
                        m.authorRole === "ops"
                          ? "bg-primary/[0.1] text-foreground ring-primary/25"
                          : "bg-background text-foreground ring-border/55",
                      )}
                    >
                      <p>{m.body}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{m.timeLabel}</p>
                    </div>
                  </div>
                ))}
                {state.typingThreadId === active.id ? (
                  <div className="flex justify-start">
                    <span className="rounded-2xl bg-background px-3 py-2 text-[12px] text-muted-foreground ring-1 ring-border/55 motion-safe:animate-pulse">
                      {active.customerName} is typing…
                    </span>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Reply to customer…"
                  className="h-10 flex-1 rounded-xl border border-border/70 bg-background px-3 text-[13px] outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground motion-safe:transition-[background-color,transform] hover:bg-primary/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send"
                >
                  <Send className="size-4" aria-hidden />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendThreadReply(active.id, q)}
                    className="rounded-full bg-muted/30 px-3 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/55 hover:ring-primary/25"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => escalateThread(active.id)}
                  disabled={active.escalated}
                  className="inline-flex items-center gap-1 rounded-lg bg-muted/30 px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-rose-500/10 hover:text-rose-600 hover:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-rose-300"
                >
                  <AlertOctagon className="size-3.5" aria-hidden />
                  Escalate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pushToast({ tone: "info", title: "Reschedule prompt", body: "Mock reschedule flow opened." });
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-muted/30 px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/50 hover:ring-primary/20"
                >
                  <CalendarClock className="size-3.5" aria-hidden />
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() =>
                    pushToast({ tone: "info", title: "Note saved", body: `${active.subject} · internal note added.` })
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-muted/30 px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/50 hover:ring-primary/20"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Add note
                </button>
                <button
                  type="button"
                  onClick={() => resolveThread(active.id)}
                  disabled={active.resolved}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11.5px] font-medium text-primary-foreground motion-safe:transition-[background-color] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Resolve
                </button>
              </div>
            </section>
          ) : null}

          <section className={cn(adminSectionClass({ priority: "default" }))}>
            <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
              <Bell className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
              Operational alerts
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">System events synced into messaging.</p>
            <ul className="mt-2 divide-y divide-border/55">
              {state.feed
                .filter((f) => f.kind === "risk" || f.kind === "support" || f.kind === "review")
                .slice(0, 4)
                .map((f) => (
                  <li key={f.id} className="flex items-start gap-3 py-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MessageCircle className="size-[15px] stroke-[1.7]" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-tight text-foreground">{f.title}</p>
                      {f.detail ? <p className="mt-0.5 text-[11.5px] text-muted-foreground">{f.detail}</p> : null}
                    </div>
                    <span className="shrink-0 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                      {f.timeLabel}
                    </span>
                  </li>
                ))}
            </ul>
          </section>

          <section className={cn(adminSectionClass({ priority: "quiet" }), "flex flex-wrap items-center justify-between gap-3")}>
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary/85" strokeWidth={1.7} aria-hidden />
              <div>
                <p className="text-[13px] font-medium text-foreground">Cleaner desk hotline</p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">Available 06:00–20:00 SAST</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                pushToast({ tone: "info", title: "Calling cleaner desk", body: "Dialler opens in the live app." })
              }
              className="rounded-lg bg-background/80 px-2.5 py-1.5 text-[12px] font-medium text-primary ring-1 ring-primary/20 motion-safe:transition-[background-color,box-shadow] hover:bg-background hover:ring-primary/30"
            >
              Call rota
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
