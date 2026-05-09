"use client";

import { Bell, CreditCard, MapPinned, Pencil, Plus, Sparkles, Tag, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

import { bpOverline, bpSectionHeading } from "@/components/booking-prototype/visual-system";

import { ADMIN_PRICING_CONTROLS, ADMIN_SERVICE_AREAS } from "../mock-admin-data";
import { adminChipClass, adminSectionClass } from "../admin-dashboard-ui";
import { useAdminWorkflow, type ToggleId } from "../admin-workflow-context";

function ToggleRow({
  id,
  label,
  description,
  state,
  onToggle,
}: {
  id: ToggleId;
  label: string;
  description: string;
  state: boolean;
  onToggle: (id: ToggleId) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-tight text-foreground">{label}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={state}
        aria-label={label}
        onClick={() => onToggle(id)}
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full ring-1 motion-safe:transition-[background-color,box-shadow,ring-color] motion-safe:duration-200",
          state
            ? "bg-primary/85 ring-primary/40 shadow-[0_2px_10px_-4px_rgba(53,99,255,0.4)]"
            : "bg-muted/55 ring-border/70",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-5 rounded-full bg-background shadow ring-1 ring-border/40 motion-safe:transition-transform motion-safe:duration-200",
            state ? "translate-x-[1.05rem]" : "translate-x-[0.15rem]",
          )}
        />
      </button>
    </li>
  );
}

export function AdminSettingsView() {
  const { state, toggleSetting, toggleArea, openDetail, pushToast } = useAdminWorkflow();
  const toggles = state.toggles;

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={bpOverline}>Settings</p>
          <h1 className="booking-display mt-1 text-[1.4rem] font-normal tracking-tight text-foreground sm:text-[1.55rem]">
            Operations control
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Pricing, dispatch, payouts and notification rules.</p>
        </div>
        <span className={adminChipClass("muted")}>Mock controls</span>
      </div>

      <section className={cn(adminSectionClass({ priority: "default" }))}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
            <Tag className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
            Pricing controls
          </h2>
          <span className={adminChipClass("info")}>ZAR</span>
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {ADMIN_PRICING_CONTROLS.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => openDetail({ kind: "editPricing", pricingId: row.id })}
              className="rounded-xl bg-muted/25 px-3 py-2.5 text-left ring-1 ring-border/55 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/40 hover:ring-primary/20"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{row.label}</p>
                <Pencil className="size-3 text-muted-foreground/70" aria-hidden />
              </div>
              <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">{row.value}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(["Edit base rates", "Surge windows", "Discount codes"] as const).map((label) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                pushToast({
                  tone: "info",
                  title: `${label} opened`,
                  body: "Mock editor will appear in the live console.",
                })
              }
              className="rounded-lg bg-card px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/70 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/40 hover:ring-primary/20"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={cn(adminSectionClass({ priority: "default" }))}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
            <MapPinned className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
            Service availability
          </h2>
          <button
            type="button"
            onClick={() => openDetail({ kind: "addArea" })}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/25 motion-safe:transition-[background-color] hover:bg-primary/15"
          >
            <Plus className="size-3" aria-hidden />
            Add area
          </button>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Tap an area to toggle whether it&apos;s bookable.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ADMIN_SERVICE_AREAS.map((seed) => {
            const live = state.liveAreas[seed.name] ?? seed.live;
            return (
              <button
                key={seed.name}
                type="button"
                onClick={() => toggleArea(seed.name)}
                aria-pressed={live}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 motion-safe:transition-[background-color,color,box-shadow] motion-safe:duration-200",
                  live
                    ? "bg-primary/[0.1] text-primary ring-primary/25"
                    : "bg-muted/30 text-muted-foreground ring-border/70 hover:bg-muted/55",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    live ? "bg-emerald-500" : "bg-muted-foreground/55",
                  )}
                />
                {seed.name}
                {!live ? " · paused" : null}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className={cn(adminSectionClass({ priority: "default" }))}>
          <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
            <Sparkles className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
            Operational rules
          </h2>
          <ul className="mt-1 divide-y divide-border/55">
            <ToggleRow
              id="auto_match"
              label="Auto-match cleaners"
              description="Suggest the best cleaner from availability + area."
              state={toggles.auto_match}
              onToggle={toggleSetting}
            />
            <ToggleRow
              id="sla_alerts"
              label="SLA risk alerts"
              description="Surface late arrivals and missed acknowledgements."
              state={toggles.sla_alerts}
              onToggle={toggleSetting}
            />
            <ToggleRow
              id="recurring_renewal"
              label="Auto-renew recurring"
              description="Renew weekly bookings unless customer pauses."
              state={toggles.recurring_renewal}
              onToggle={toggleSetting}
            />
            <ToggleRow
              id="support_routing"
              label="Smart support routing"
              description="Route VIP threads to senior ops first."
              state={toggles.support_routing}
              onToggle={toggleSetting}
            />
          </ul>
        </section>

        <section className={cn(adminSectionClass({ priority: "default" }))}>
          <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
            <Wallet className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
            Payouts &amp; finance
          </h2>
          <ul className="mt-1 divide-y divide-border/55">
            <ToggleRow
              id="payout_holds"
              label="Hold disputed payouts"
              description="Pause amounts where ratings or refunds are open."
              state={toggles.payout_holds}
              onToggle={toggleSetting}
            />
            <li className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-tight text-foreground">Payout cadence</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">Weekly · releases each Monday</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  pushToast({ tone: "info", title: "Payout cadence", body: "Editor opens in the live console." })
                }
                className="shrink-0 rounded-lg bg-card px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/70 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/40 hover:ring-primary/20"
              >
                Edit
              </button>
            </li>
            <li className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-tight text-foreground">Cleaner share</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">65% of net visit revenue</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  pushToast({ tone: "info", title: "Cleaner share", body: "Editor opens in the live console." })
                }
                className="shrink-0 rounded-lg bg-card px-2.5 py-1 text-[11.5px] font-medium text-foreground ring-1 ring-border/70 motion-safe:transition-[background-color,box-shadow] hover:bg-muted/40 hover:ring-primary/20"
              >
                Adjust
              </button>
            </li>
          </ul>
        </section>
      </div>

      <section className={cn(adminSectionClass({ priority: "default" }))}>
        <h2 className={cn(bpSectionHeading, "flex items-center gap-2 booking-display text-[1.05rem]")}>
          <Bell className="size-4 text-primary/85" strokeWidth={1.7} aria-hidden />
          Notifications
        </h2>
        <ul className="mt-1 divide-y divide-border/55">
          <ToggleRow
            id="marketing"
            label="Customer marketing emails"
            description="Recurring renewal nudges and win-back flows."
            state={toggles.marketing}
            onToggle={toggleSetting}
          />
          <li className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-tight text-foreground">Operator alert channels</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">In-app · Email · WhatsApp</p>
            </div>
            <span className={adminChipClass("info", "px-2 py-0.5 text-[10px]")}>3 active</span>
          </li>
        </ul>
      </section>

      <section className={cn(adminSectionClass({ priority: "quiet" }), "flex flex-wrap items-center justify-between gap-3")}>
        <div className="flex items-start gap-2.5">
          <CreditCard className="mt-0.5 size-4 shrink-0 text-primary/85" strokeWidth={1.7} aria-hidden />
          <div>
            <p className="text-[13px] font-medium text-foreground">Billing &amp; integrations</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Stripe · Yoco · WhatsApp Business · Supabase</p>
          </div>
        </div>
        <span className={adminChipClass("muted")}>Mock view</span>
      </section>
    </div>
  );
}
