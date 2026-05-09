"use client";

import { CheckCircle2, ChevronDown, ChevronUp, CreditCard, Plus, Receipt, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";
import { formatZar } from "@/components/booking-prototype/mock-pricing";

import { customerSectionClass } from "../customer-dashboard-ui";
import { useCustomerWorkflow } from "../customer-workflow-context";
import { customerHasInvoices, customerHasPaymentHistory } from "../customer-dashboard-visibility";
import { MOCK_PAYMENT } from "../mock-customer-data";

export function PaymentsView() {
  const hasInvoices = customerHasInvoices();
  const hasHistory = customerHasPaymentHistory();
  const {
    cards,
    expandedInvoiceId,
    expandedHistoryId,
    setDefaultCard,
    removeCard,
    openDetail,
    setExpandedInvoice,
    setExpandedHistory,
    pushToast,
  } = useCustomerWorkflow();

  const hasCards = cards.length > 0;

  return (
    <div className="space-y-3 md:space-y-4">
      <div>
        <p className={bpOverline}>Billing</p>
        <h1 className="booking-display mt-1 text-[1.35rem] font-normal tracking-tight text-foreground sm:text-[1.5rem]">
          Payments
        </h1>
        <p className="mt-1 max-w-lg text-[12px] text-muted-foreground sm:text-[13px]">
          {hasInvoices || hasHistory ? "Cards, receipts, and history." : "Receipts after your first visit."}
        </p>
      </div>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary/90" strokeWidth={1.75} aria-hidden />
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Saved cards</h2>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-lg text-[12px]"
            onClick={() => openDetail({ kind: "addCard" })}
          >
            <Plus className="size-3.5" aria-hidden />
            Add card
          </Button>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Tap a card to make it your default</p>
        {!hasCards ? (
          <div className="mt-2.5 rounded-2xl border border-dashed border-border/65 bg-muted/[0.08] p-4 sm:p-5">
            <p className="text-[13px] font-medium text-foreground">Add a card when you book</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Securely stored · preview only, no charges.</p>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/50 bg-background/70 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0 text-primary/85" strokeWidth={1.75} aria-hidden />
              <span>PCI-aligned · emailed receipts</span>
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-3 rounded-xl"
              onClick={() => openDetail({ kind: "addCard" })}
            >
              <Plus className="size-3.5" aria-hidden />
              Add a card
            </Button>
          </div>
        ) : (
          <ul className="mt-2.5 space-y-2">
            {cards.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border bg-gradient-to-br from-muted/20 via-card to-card px-3 py-3 motion-safe:transition-[box-shadow,transform,border-color] motion-safe:duration-300 hover:-translate-y-px hover:shadow-[0_12px_36px_-22px_rgba(53,99,255,0.18)]",
                  c.default ? "border-primary/30 ring-1 ring-primary/15" : "border-border/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => setDefaultCard(c.id)}
                  className="flex flex-1 items-center gap-2.5 text-left"
                  aria-pressed={c.default}
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-[14px] font-medium text-foreground">{c.label}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {c.default ? "Default for next visit" : "Tap to make default"}
                    </span>
                  </span>
                  {c.default ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      <Sparkles className="size-3 opacity-80" aria-hidden />
                      Preferred
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => removeCard(c.id)}
                  aria-label={`Remove ${c.label}`}
                  disabled={cards.length <= 1}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-muted/55 hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={customerSectionClass({ priority: "default" })}>
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-primary/90" strokeWidth={1.75} aria-hidden />
          <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Receipts</h2>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Recent invoices · tap to view</p>
        {!hasInvoices ? (
          <div className="mt-2.5 rounded-2xl border border-border/50 bg-gradient-to-br from-muted/15 via-background/90 to-primary/[0.04] p-4 ring-1 ring-border/40 sm:p-5">
            <p className="text-[14px] font-semibold text-foreground">Invoices appear after your first visit</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">PDFs when email billing is on.</p>
            <Link
              href="/prototype/booking"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3 inline-flex rounded-xl ring-1 ring-border/70",
              )}
            >
              Plan first visit
            </Link>
          </div>
        ) : (
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
            {MOCK_PAYMENT.invoices.map((inv) => {
              const open = expandedInvoiceId === inv.id;
              return (
                <div
                  key={inv.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-card/80 p-4 shadow-[0_2px_20px_-14px_rgba(15,23,42,0.12)] ring-1 motion-safe:transition-[box-shadow,transform,border-color] motion-safe:duration-300 hover:-translate-y-px hover:shadow-[0_16px_44px_-28px_rgba(53,99,255,0.16)]",
                    open ? "border-primary/30 ring-primary/15" : "border-border/35 ring-border/30",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedInvoice(open ? null : inv.id)}
                    className="flex items-start justify-between gap-2 border-b border-border/40 pb-2.5 text-left"
                    aria-expanded={open}
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Receipt</p>
                      <p className="mt-1 text-[15px] font-semibold leading-snug text-foreground">{inv.label}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{inv.serviceLine}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="shrink-0 rounded-full bg-[color:var(--booking-success)]/12 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--booking-success)]">
                        {inv.status}
                      </span>
                      {open ? (
                        <ChevronUp className="size-3.5 text-muted-foreground" aria-hidden />
                      ) : (
                        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                  </button>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{inv.periodLabel}</p>
                  <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-foreground">{formatZar(inv.amountZar)}</p>
                  <p className="mt-2 text-[12px] text-muted-foreground">{inv.folioNote}</p>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="min-h-0 overflow-hidden" inert={!open ? true : undefined}>
                      <div className="mt-3 space-y-1.5 border-t border-border/40 pt-2.5 text-[12px] text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-emerald-600" aria-hidden />
                          Card charged · receipt emailed
                        </p>
                        <p className="flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-emerald-600" aria-hidden />
                          Tip eligible window has closed
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2 h-8 rounded-lg text-[12px]"
                          onClick={() => openDetail({ kind: "invoice", invoiceId: inv.id })}
                        >
                          View receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={customerSectionClass({ priority: "quiet" })}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className={cn(bpSectionHeading, "booking-display text-[1.05rem]")}>Payment history</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Chronological</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-lg text-muted-foreground"
            onClick={() =>
              pushToast({ tone: "info", title: "Statement requested", body: "We'll email a CSV summary." })
            }
          >
            Request statement
          </Button>
        </div>
        {!hasHistory ? (
          <p className="mt-2 rounded-lg border border-border/45 bg-muted/[0.06] px-3 py-2 text-[12px] text-muted-foreground">
            Charges list here after your first payment.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {MOCK_PAYMENT.history.map((h) => {
              const open = expandedHistoryId === h.id;
              return (
                <li
                  key={h.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border bg-background/55 px-3 py-2.5 motion-safe:transition-[border-color,box-shadow] motion-safe:duration-200 hover:border-primary/15 hover:shadow-sm",
                    open ? "border-primary/25" : "border-border/35",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedHistory(open ? null : h.id)}
                    className="flex flex-col gap-1 text-left sm:flex-row sm:items-center sm:justify-between"
                    aria-expanded={open}
                  >
                    <span className="text-[13px] font-medium text-foreground">{h.label}</span>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 sm:flex-col sm:items-end sm:text-right">
                      <span className="text-[13px] font-semibold tabular-nums text-foreground">{formatZar(h.amountZar)}</span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">{h.dateLabel}</span>
                    </div>
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="min-h-0 overflow-hidden" inert={!open ? true : undefined}>
                      <div className="mt-1.5 space-y-1 border-t border-border/40 pt-1.5 text-[11.5px] text-muted-foreground">
                        <p>Payment captured to default card.</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-lg px-2 text-[11.5px] text-primary"
                          onClick={() => {
                            const inv = MOCK_PAYMENT.invoices[0];
                            if (inv) openDetail({ kind: "invoice", invoiceId: inv.id });
                          }}
                        >
                          View receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-center text-[11px] text-muted-foreground">Preview · no charges</p>
      </section>
    </div>
  );
}
