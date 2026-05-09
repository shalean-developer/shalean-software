"use client";

import { useEffect, useRef, useState } from "react";
import {
  Headphones,
  MessageSquareText,
  Radio,
  Send,
  Sparkles,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { cleanerSectionClass } from "../cleaner-dashboard-ui";
import { CleanerEmptyMessages } from "../cleaner-empty-states";
import { useCleanerWorkflow } from "../cleaner-workflow-context";
import type { CleanerThread } from "../mock-cleaner-data";

const KIND_ICON = {
  support: Headphones,
  customer: StickyNote,
  dispatch: Radio,
  alert: MessageSquareText,
} as const;

const QUICK_REPLIES = [
  "On my way — see you soon!",
  "Wrapping up the kitchen now.",
  "Could you re-share the access code?",
] as const;

function ThreadRow({
  thread,
  active,
  onSelect,
}: {
  thread: CleanerThread;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = KIND_ICON[thread.kind];
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:active:scale-[0.998]",
        active
          ? "bg-primary/[0.08] ring-1 ring-primary/25"
          : "hover:bg-muted/45",
        thread.unread && !active ? "bg-primary/[0.03]" : null,
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
          active ? "bg-primary/15 text-primary ring-primary/25" : "bg-muted/40 text-primary/85 ring-border/70",
        )}
      >
        <Icon className="size-[1.15rem]" strokeWidth={1.65} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[14px] font-medium text-foreground">{thread.title}</span>
            {thread.unread ? (
              <span className="size-1.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse motion-reduce:animate-none" aria-hidden />
            ) : null}
          </span>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
            {thread.timeLabel}
          </span>
        </span>
        <span className="text-[11px] text-muted-foreground">{thread.subtitle}</span>
        <span className="line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">{thread.preview}</span>
        {thread.bookingRef ? (
          <span className="inline-flex max-w-full items-center rounded-md border border-border/60 bg-muted/25 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {thread.bookingRef}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-muted/40 px-3 py-2 ring-1 ring-border/55" aria-label="Typing">
      <span className="flex gap-1">
        <span className="proto-dash-typing-dot size-1.5 rounded-full bg-primary/60" />
        <span className="proto-dash-typing-dot size-1.5 rounded-full bg-primary/60" />
        <span className="proto-dash-typing-dot size-1.5 rounded-full bg-primary/60" />
      </span>
      <span className="text-[11px] text-muted-foreground">Typing…</span>
    </div>
  );
}

export function CleanerMessagesView() {
  const {
    threads,
    activeThreadId,
    openThread,
    sendThreadReply,
    typingThreadId,
    pushToast,
  } = useCleanerWorkflow();

  const active = threads.find((t) => t.id === activeThreadId) ?? threads[0];
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active?.messages.length, typingThreadId]);

  if (threads.length === 0 || !active) {
    return (
      <div className="space-y-4">
        <div>
          <p className={bpOverline}>Messages</p>
          <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.48rem]">
            Updates
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Support, guests, and dispatch — in one calm thread.
          </p>
        </div>
        <CleanerEmptyMessages />
      </div>
    );
  }

  const handleSend = (body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    sendThreadReply(active.id, trimmed);
    setDraft("");
  };

  const unreadCount = threads.filter((t) => t.unread).length;

  return (
    <div className="space-y-4">
      <div>
        <p className={bpOverline}>Messages</p>
        <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.48rem]">
          Updates
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} unread · tap a thread to reply.`
            : "Support, guests, and dispatch — in one calm thread."}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)]">
        <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Inbox</h2>
            <p className="text-[11px] text-muted-foreground">
              {threads.length} thread{threads.length === 1 ? "" : "s"}
            </p>
          </div>
          <ul className="flex flex-col gap-1.5" role="listbox" aria-label="Threads">
            {threads.map((t) => (
              <li key={t.id}>
                <ThreadRow thread={t} active={t.id === active.id} onSelect={() => openThread(t.id)} />
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-3">
          <section className={cn(cleanerSectionClass({ priority: "emphasis" }), "flex flex-col gap-3 p-4 sm:p-5")}>
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {(() => {
                  const Icon = KIND_ICON[active.kind];
                  return <Icon className="size-[1.05rem]" strokeWidth={1.75} aria-hidden />;
                })()}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>{active.title}</h2>
                <p className="text-[11.5px] text-muted-foreground">{active.subtitle}</p>
              </div>
            </div>

            <div
              className="flex max-h-[min(50vh,28rem)] flex-col gap-2 overflow-y-auto rounded-xl bg-muted/20 p-3 ring-1 ring-border/55 [-webkit-overflow-scrolling:touch]"
              aria-live="polite"
            >
              {active.messages.map((m) => {
                const isYou = m.role === "you";
                return (
                  <div key={m.id} className={cn("flex", isYou ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl px-3 py-2 sm:max-w-[80%]",
                        isYou
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-background/95 ring-1 ring-border/65",
                      )}
                    >
                      <p className="text-[13px] leading-relaxed">{m.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px] font-medium tabular-nums",
                          isYou ? "text-primary-foreground/75" : "text-muted-foreground",
                        )}
                      >
                        {m.timeLabel}
                        {isYou ? " · Read" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              {typingThreadId === active.id ? (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:border-primary/25 hover:bg-primary/[0.06] hover:text-foreground active:scale-[0.97]"
                >
                  <Sparkles className="size-3 text-primary/80" strokeWidth={1.85} aria-hidden />
                  {q}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(draft);
              }}
              className="flex items-center gap-2 rounded-2xl bg-background/95 px-2 py-1 ring-1 ring-border/70 focus-within:ring-primary/40"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Reply to dispatch…"
                aria-label="Compose reply"
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[13px] outline-none placeholder:text-muted-foreground/70"
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-xl"
                disabled={draft.trim().length === 0}
                aria-label="Send reply"
              >
                <Send className="size-3.5" strokeWidth={1.85} aria-hidden />
                Send
              </Button>
            </form>
          </section>

          <section className={cn(cleanerSectionClass({ priority: "default" }), "p-4 sm:p-5")}>
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Shortcuts</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start rounded-xl"
                onClick={() => {
                  pushToast({
                    tone: "primary",
                    title: "Care desk pinged",
                    body: "We'll reply in this thread shortly.",
                  });
                  openThread("th-support");
                }}
              >
                <Headphones className="size-3.5" aria-hidden />
                Open support thread
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start rounded-xl"
                onClick={() => {
                  pushToast({
                    tone: "info",
                    title: "Dispatch acknowledged",
                    body: "They’ll respond within minutes.",
                  });
                  openThread("th-dispatch");
                }}
              >
                <Radio className="size-3.5" aria-hidden />
                Ping dispatch
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
