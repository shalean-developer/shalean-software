"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Headphones, HelpCircle, MessageCircle, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { customerSectionClass } from "../customer-dashboard-ui";
import { useCustomerWorkflow } from "../customer-workflow-context";
import { customerHasMessageThreads } from "../customer-dashboard-visibility";
import {
  MOCK_ASSIGNED_CLEANER,
  MOCK_MESSAGES_PREVIEW,
  MOCK_NOTIFICATIONS,
} from "../mock-customer-data";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2" aria-label="Typing">
      <span className="text-[11px] text-muted-foreground">Typing…</span>
      <span className="flex gap-1 pl-1">
        <span className="proto-dash-typing-dot size-1.5 rounded-full bg-primary/50" />
        <span className="proto-dash-typing-dot size-1.5 rounded-full bg-primary/50" />
        <span className="proto-dash-typing-dot size-1.5 rounded-full bg-primary/50" />
      </span>
    </div>
  );
}

export function MessagesView() {
  const hasThreads = customerHasMessageThreads();
  const {
    threads,
    activeThreadId,
    typingThreadId,
    openThread,
    sendThreadReply,
    openDetail,
    pushToast,
  } = useCustomerWorkflow();

  const active = threads.find((t) => t.id === activeThreadId) ?? threads[0];
  const isTyping = typingThreadId === active?.id;

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active?.messages.length, isTyping]);

  const handleSend = () => {
    const value = draft.trim();
    if (!value || !active) return;
    sendThreadReply(active.id, value);
    setDraft("");
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div>
        <p className={bpOverline}>Care desk</p>
        <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.5rem]">
          Messages
        </h1>
        <p className="mt-1 max-w-lg text-[12px] text-muted-foreground sm:text-[13px]">
          {hasThreads ? "Visit threads and updates." : "Threads open after your first booking."}
        </p>
      </div>

      {!hasThreads ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <section className={customerSectionClass({ priority: "hero" })}>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary">
                <MessageCircle className="size-[1.15rem]" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className={cn(bpSectionHeading, "booking-display text-[1.08rem]")}>Need something before you book?</h2>
                <p className="mt-1 text-[12px] text-muted-foreground">We&apos;re here weekdays · quick replies when chat is live.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-8 rounded-lg text-[12px]"
                    onClick={() => pushToast({ tone: "primary", title: "Live chat opening", body: "Care desk paged." })}
                  >
                    Chat when live
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[12px]"
                    onClick={() => pushToast({ tone: "info", title: "FAQ opened", body: "Common questions answered." })}
                  >
                    <HelpCircle className="size-3.5" aria-hidden />
                    FAQ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[12px]"
                    onClick={() => pushToast({ tone: "info", title: "WhatsApp queued", body: "We'll ping you on +27 21 ···" })}
                  >
                    WhatsApp
                  </Button>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">{MOCK_MESSAGES_PREVIEW.lastSnippet}</p>
              </div>
            </div>
          </section>

          <section className={customerSectionClass({ priority: "default" })}>
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Cleaner messages</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Opens after your first visit</p>
            <div className="mt-2.5 rounded-xl border border-dashed border-border/70 bg-muted/[0.06] px-3 py-3">
              <p className="text-[12px] text-muted-foreground">
                Demo name: <span className="font-medium text-foreground">{MOCK_ASSIGNED_CLEANER.name}</span>
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
          <section className={customerSectionClass({ priority: "default" })}>
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Threads</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Tap to open</p>
            <ul className="mt-2.5 divide-y divide-border/60 overflow-hidden rounded-xl ring-1 ring-border/55" role="listbox" aria-label="Message threads">
              {threads.map((t) => {
                const on = t.id === active?.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => openThread(t.id)}
                      className={cn(
                        "flex w-full flex-col gap-0.5 px-3 py-3 text-left motion-safe:transition-[background-color,transform] motion-safe:duration-200",
                        on ? "bg-primary/[0.08]" : "hover:bg-muted/45 active:scale-[0.998]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[14px] font-medium text-foreground">
                          {t.unread ? (
                            <span className="size-1.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse motion-reduce:animate-none" aria-hidden />
                          ) : null}
                          {t.title}
                        </span>
                        <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">{t.timeLabel}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{t.subtitle}</span>
                      {t.bookingRef ? (
                        <span className="inline-flex max-w-full items-center rounded-md border border-border/60 bg-muted/25 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {t.bookingRef}
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "line-clamp-2 text-[12px] leading-snug",
                          t.unread ? "font-medium text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {t.preview}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="space-y-3">
            <section className={customerSectionClass({ priority: "quiet" })}>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageCircle className="size-[1.05rem]" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>{active?.title}</h2>
                  {active?.supportReplyHint ? (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/[0.05] px-2 py-1 text-[11px] font-medium text-foreground">
                      <span className="size-1.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse motion-reduce:animate-none" />
                      {active.supportReplyHint}
                    </p>
                  ) : null}
                  <div className="mt-3 max-h-[min(52vh,28rem)] space-y-2.5 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
                    {active?.messages.map((m) => {
                      const isYou = m.role === "you";
                      return (
                        <div key={m.id} className={cn("flex motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-reduce:animate-none", isYou ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[92%] rounded-2xl px-3 py-2 sm:max-w-[85%]",
                              isYou
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : "rounded-bl-md bg-background/90 ring-1 ring-border/70",
                            )}
                          >
                            <p className="text-[13px] leading-relaxed">{m.body}</p>
                            <p
                              className={cn(
                                "mt-1 flex items-center gap-1 text-[10px] font-medium tabular-nums",
                                isYou ? "text-primary-foreground/75" : "text-muted-foreground",
                              )}
                            >
                              {m.timeLabel}
                              {isYou ? <span aria-hidden>· delivered</span> : null}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {isTyping ? <TypingIndicator /> : null}
                    <div ref={messagesEndRef} />
                  </div>

                  {active?.scriptedReplies?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {active.scriptedReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => setDraft(reply)}
                          className="rounded-full border border-border/65 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 hover:border-primary/25 hover:bg-primary/[0.05] active:scale-[0.98]"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="mt-2 flex items-end gap-2"
                  >
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={active ? `Message ${active.title}…` : "Type a message…"}
                      aria-label="Message"
                      className="min-h-10 flex-1 rounded-xl border border-border/65 bg-background px-3 py-2 text-[13px] outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-10 rounded-xl"
                      disabled={!draft.trim()}
                    >
                      <Send className="size-3.5" aria-hidden />
                      Send
                    </Button>
                  </form>
                </div>
              </div>
            </section>

            <section className={customerSectionClass({ priority: "default" })}>
              <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Your cleaner</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{MOCK_ASSIGNED_CLEANER.tagline}</p>
              <button
                type="button"
                onClick={() => openDetail({ kind: "cleaner" })}
                className="mt-2 flex w-full items-center gap-2.5 rounded-xl bg-muted/25 p-2.5 text-left ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 hover:bg-muted/45 hover:shadow-sm active:scale-[0.99]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                  {MOCK_ASSIGNED_CLEANER.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{MOCK_ASSIGNED_CLEANER.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {MOCK_ASSIGNED_CLEANER.rating} ★ · {MOCK_ASSIGNED_CLEANER.reviewCount} reviews
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-primary/85">
                  Profile
                  <Sparkles className="size-3" strokeWidth={1.85} aria-hidden />
                </span>
              </button>
            </section>
          </div>
        </div>
      )}

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary/90" strokeWidth={1.75} aria-hidden />
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Notifications</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Reminders and receipts</p>
        {MOCK_NOTIFICATIONS.length === 0 ? (
          <p className="mt-2 rounded-lg border border-border/50 bg-muted/[0.06] px-3 py-2 text-[12px] text-muted-foreground">
            Nothing yet — reminders appear after you book.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {MOCK_NOTIFICATIONS.map((n) => (
              <li
                key={n.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border/50 bg-card/60 px-3 py-2 text-[13px] motion-safe:transition-[border-color,box-shadow] motion-safe:duration-200 hover:border-primary/12 hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => pushToast({ tone: "info", title: n.label, body: n.detail })}
                  className="text-left"
                >
                  <p className="font-medium text-foreground">{n.label}</p>
                  <p className="text-[12px] text-muted-foreground">{n.detail}</p>
                </button>
                <span className="text-[11px] tabular-nums text-muted-foreground">{n.timeLabel}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={customerSectionClass({ priority: "quiet" })}>
        <button
          type="button"
          onClick={() => openThread("th_support")}
          className="flex w-full items-start gap-2.5 rounded-xl text-left motion-safe:transition-[background-color] motion-safe:duration-200 hover:bg-muted/30"
        >
          <Headphones className="mt-0.5 size-4 shrink-0 text-primary/90" strokeWidth={1.75} aria-hidden />
          <div>
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Support</h2>
            <p className="mt-0.5 text-[12px] text-foreground">{MOCK_MESSAGES_PREVIEW.lastSnippet}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {MOCK_MESSAGES_PREVIEW.unreadCount === 0 ? "All caught up" : `${MOCK_MESSAGES_PREVIEW.unreadCount} unread`}
            </p>
          </div>
        </button>
      </section>
    </div>
  );
}
