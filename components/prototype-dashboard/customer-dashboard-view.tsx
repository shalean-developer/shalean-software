"use client";

import "./dashboard-prototype-motion.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Settings,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bp } from "@/components/booking-prototype/visual-system";

import { CustomerDetailSheet } from "./customer-detail-sheet";
import { CustomerToastStack } from "./customer-toast-stack";
import {
  MOBILE_FOOTER_OFFSET_CSS,
  MOBILE_SCROLL_PADDING_BOTTOM_CSS,
} from "./dashboard-primitives";
import { CustomerWorkflowProvider, useCustomerWorkflow } from "./customer-workflow-context";
import { DashboardOverview } from "./customer-views/dashboard-overview";
import { MessagesView } from "./customer-views/messages-view";
import { PaymentsView } from "./customer-views/payments-view";
import { PreferencesView } from "./customer-views/preferences-view";
import { VisitsView } from "./customer-views/visits-view";
import type { CustomerNavTab } from "./customer-dashboard-ui";
import { MOCK_CUSTOMER } from "./mock-customer-data";

const TAB_PANEL_ID = "customer-tabpanel";

const MOBILE_FOOTER_OFFSET = MOBILE_FOOTER_OFFSET_CSS;

type NavIcon = typeof LayoutDashboard;

type SidebarNavItem = {
  tab: CustomerNavTab;
  label: string;
  icon: NavIcon;
  description?: string;
};

type BottomPrimaryItem = {
  tab: CustomerNavTab;
  label: string;
  icon: NavIcon;
};

const sidebarNavItems: SidebarNavItem[] = [
  { tab: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { tab: "visits", label: "Visits", icon: CalendarDays },
  { tab: "messages", label: "Messages", icon: MessageSquare },
  { tab: "payments", label: "Payments", icon: CreditCard },
  { tab: "preferences", label: "Preferences", icon: SlidersHorizontal },
];

const bottomPrimaryItems: BottomPrimaryItem[] = [
  { tab: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { tab: "visits", label: "Visits", icon: CalendarDays },
  { tab: "messages", label: "Messages", icon: MessageSquare },
  { tab: "payments", label: "Payments", icon: CreditCard },
];

const moreSecondaryItems: SidebarNavItem[] = [
  {
    tab: "preferences",
    label: "Preferences",
    icon: SlidersHorizontal,
    description: "Address, extras, recurring",
  },
];

const SECONDARY_TAB_SET = new Set<CustomerNavTab>(moreSecondaryItems.map((i) => i.tab));

function customerInitials(firstName: string, email: string) {
  const fromName = firstName.trim().slice(0, 1).toUpperCase();
  const fromEmail = email.split("@")[0]?.slice(0, 1).toUpperCase() ?? "";
  return `${fromName}${fromEmail}` || "S";
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-bold leading-none text-primary-foreground">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function CustomerSidebarNav({
  activeTab,
  onSelect,
  unread,
}: {
  activeTab: CustomerNavTab;
  onSelect: (tab: CustomerNavTab) => void;
  unread: number;
}) {
  return (
    <nav className="mt-6 flex flex-1 flex-col gap-0.5" role="tablist" aria-label="Account">
      {sidebarNavItems.map((item) => {
        const Icon = item.icon;
        const selected = activeTab === item.tab;
        return (
          <button
            key={`sidebar-${item.tab}`}
            type="button"
            role="tab"
            id={`customer-tab-rail-${item.tab}`}
            aria-selected={selected}
            aria-controls={TAB_PANEL_ID}
            onClick={() => onSelect(item.tab)}
            aria-label={`${item.label} tab`}
            className={cn(
              "group flex w-full cursor-pointer touch-manipulation items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium",
              "motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200",
              selected
                ? "bg-primary/[0.1] text-foreground shadow-[inset_3px_0_0_0_var(--primary)] ring-1 ring-primary/15"
                : "text-muted-foreground hover:bg-muted/55 hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-[17px] shrink-0 stroke-[1.65] motion-safe:transition-transform motion-safe:duration-200 group-hover:scale-[1.04]",
                selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
              aria-hidden
            />
            {item.label}
            {item.tab === "messages" ? <UnreadBadge count={unread} /> : null}
          </button>
        );
      })}
    </nav>
  );
}

function CustomerBottomNav({
  activeTab,
  onSelect,
  onMoreOpen,
  moreOpen,
  unread,
}: {
  activeTab: CustomerNavTab;
  onSelect: (tab: CustomerNavTab) => void;
  onMoreOpen: () => void;
  moreOpen: boolean;
  unread: number;
}) {
  const moreActive = SECONDARY_TAB_SET.has(activeTab);

  return (
    <nav className="flex w-full items-stretch px-1" role="tablist" aria-label="Primary">
      {bottomPrimaryItems.map((item) => {
        const Icon = item.icon;
        const selected = activeTab === item.tab && !moreOpen;
        const showUnread = item.tab === "messages" && unread > 0;
        return (
          <button
            key={`bottom-${item.tab}`}
            type="button"
            role="tab"
            id={`customer-tab-bar-${item.tab}`}
            aria-selected={selected}
            aria-controls={TAB_PANEL_ID}
            onClick={() => onSelect(item.tab)}
            aria-label={`${item.label} tab`}
            className={cn(
              "group relative flex flex-1 cursor-pointer touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-medium",
              "motion-safe:transition-[color,transform] motion-safe:duration-200 motion-safe:ease-out",
              selected
                ? "text-primary motion-safe:scale-[1.02] motion-reduce:scale-100"
                : "text-muted-foreground active:scale-[0.97]",
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-2xl motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
                selected && "bg-primary/[0.12] shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
              )}
            >
              <Icon className={cn("size-[1.15rem] shrink-0 stroke-[1.7]", selected && "text-primary")} aria-hidden />
            </span>
            {showUnread ? (
              <span className="absolute right-3 top-1.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
            <span className="text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]">
              {item.label}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        id="customer-tab-bar-more"
        onClick={onMoreOpen}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        aria-label="More navigation"
        className={cn(
          "group flex flex-1 cursor-pointer touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-medium",
          "motion-safe:transition-[color,transform] motion-safe:duration-200 motion-safe:ease-out",
          moreActive || moreOpen
            ? "text-primary motion-safe:scale-[1.02] motion-reduce:scale-100"
            : "text-muted-foreground active:scale-[0.97]",
        )}
      >
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-2xl motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
            (moreActive || moreOpen) &&
              "bg-primary/[0.12] shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
          )}
        >
          <MoreHorizontal
            className={cn(
              "size-[1.15rem] shrink-0 stroke-[1.7]",
              (moreActive || moreOpen) && "text-primary",
            )}
            aria-hidden
          />
        </span>
        <span className="text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]">More</span>
      </button>
    </nav>
  );
}

function CustomerMoreDrawer({
  open,
  onClose,
  activeTab,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  activeTab: CustomerNavTab;
  onSelect: (tab: CustomerNavTab) => void;
}) {
  const { pushToast, openDetail, primaryBookingId } = useCustomerWorkflow();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (tab: CustomerNavTab) => {
    onSelect(tab);
    onClose();
  };

  const initials = customerInitials(MOCK_CUSTOMER.firstName, MOCK_CUSTOMER.email);

  return (
    <div className="md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        style={{ bottom: MOBILE_FOOTER_OFFSET }}
        className="fixed inset-x-0 top-0 z-50 cursor-default bg-foreground/30 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none"
      />
      <aside
        style={{ bottom: MOBILE_FOOTER_OFFSET }}
        className={cn(
          "fixed right-0 top-0 z-[60] flex w-[min(86vw,22rem)] flex-col overflow-hidden rounded-l-3xl border-l border-border/60 bg-background/98 shadow-[-14px_0_44px_-18px_rgba(15,23,48,0.32)] backdrop-blur-xl",
          "motion-safe:animate-in motion-safe:slide-in-from-right-8 motion-safe:duration-300 motion-safe:ease-out motion-reduce:animate-none",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-2">
          <div className="min-w-0">
            <p className={cn(bp.navWordmark, "tracking-tight")}>Shalean</p>
            <p className="text-[11.5px] font-medium text-muted-foreground">More options</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close more"
            className="inline-flex size-9 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-muted/45 hover:text-foreground active:scale-[0.97]"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3 [-webkit-overflow-scrolling:touch]">
          <div className="flex items-center gap-3 rounded-2xl bg-muted/35 px-3 py-2.5 ring-1 ring-border/55">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/[0.14] text-[13px] font-semibold tracking-tight text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="booking-display truncate text-[14.5px] leading-tight text-foreground">
                {MOCK_CUSTOMER.firstName}
              </p>
              <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                {MOCK_CUSTOMER.email}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/[0.1] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/25">
              Preview
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleSelect("preferences")}
            className="mt-2.5 flex w-full items-center gap-3 rounded-2xl bg-primary/[0.06] px-3 py-2.5 text-left ring-1 ring-primary/20 motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 hover:bg-primary/[0.09] active:scale-[0.99]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <SlidersHorizontal className="size-[17px] stroke-[1.7]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium leading-tight text-foreground">
                Preferences shortcut
              </span>
              <span className="block text-[11px] leading-snug text-muted-foreground">
                Saved address, extras &amp; recurring
              </span>
            </span>
            <ChevronRight className="size-4 text-primary/70" aria-hidden />
          </button>

          {primaryBookingId ? (
            <button
              type="button"
              onClick={() => {
                openDetail({ kind: "visit", bookingId: primaryBookingId });
                onClose();
              }}
              className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-muted/30 px-3 py-2.5 text-left ring-1 ring-border/60 motion-safe:transition-[background-color] motion-safe:duration-200 hover:bg-muted/55 active:scale-[0.99]"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <CalendarDays className="size-[17px] stroke-[1.7]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium leading-tight text-foreground">Open next visit</span>
                <span className="block text-[11px] leading-snug text-muted-foreground">Lifecycle, reschedule, cancel</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground/55" aria-hidden />
            </button>
          ) : null}

          <ul className="mt-3 flex flex-col gap-0.5">
            {moreSecondaryItems.map((it) => {
              const selected = activeTab === it.tab;
              const Icon = it.icon;
              return (
                <li key={it.tab}>
                  <button
                    type="button"
                    onClick={() => handleSelect(it.tab)}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left motion-safe:transition-[background-color,color] motion-safe:duration-200 active:scale-[0.99]",
                      selected ? "bg-primary/[0.08] ring-1 ring-primary/20" : "hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl motion-safe:transition-colors motion-safe:duration-200",
                        selected
                          ? "bg-primary/15 text-primary"
                          : "bg-muted/45 text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      <Icon className="size-[17px] stroke-[1.7]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium leading-tight text-foreground">{it.label}</span>
                      {it.description ? (
                        <span className="block text-[11px] leading-snug text-muted-foreground">{it.description}</span>
                      ) : null}
                    </span>
                    <ChevronRight
                      className={cn("size-4", selected ? "text-primary/70" : "text-muted-foreground/55")}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}

            {(
              [
                {
                  id: "settings",
                  label: "Settings",
                  description: "Account & notifications",
                  icon: Settings,
                  toast: { tone: "info" as const, title: "Settings", body: "Account preferences open in the live app." },
                },
                {
                  id: "help",
                  label: "Help & support",
                  description: "Reach the care team",
                  icon: LifeBuoy,
                  toast: { tone: "primary" as const, title: "Care desk pinged", body: "We’ll reply in your inbox shortly." },
                },
              ] as const
            ).map((it) => {
              const Icon = it.icon;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      pushToast(it.toast);
                      onClose();
                    }}
                    className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left motion-safe:transition-[background-color] motion-safe:duration-200 hover:bg-muted/40 active:scale-[0.99]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-muted/45 text-muted-foreground motion-safe:transition-colors motion-safe:duration-200 group-hover:text-foreground">
                      <Icon className="size-[17px] stroke-[1.7]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium leading-tight text-foreground">{it.label}</span>
                      <span className="block text-[11px] leading-snug text-muted-foreground">{it.description}</span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground/55" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-border/55 px-4 pb-3 pt-2.5">
          <div className="flex flex-col gap-1.5">
            <Link
              href="/prototype/booking"
              onClick={onClose}
              className={cn(
                buttonVariants({ size: "sm" }),
                "w-full justify-center gap-2 rounded-xl shadow-[0_2px_12px_-4px_rgba(53,99,255,0.35)]",
              )}
            >
              <Sparkles className="size-3.5" aria-hidden />
              New visit
            </Link>
            <Link
              href="/prototype"
              onClick={onClose}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full justify-center rounded-xl text-muted-foreground",
              )}
            >
              Back to hub
            </Link>
            <button
              type="button"
              onClick={() => {
                pushToast({
                  tone: "info",
                  title: "Signed out (mock)",
                  body: "This prototype keeps you signed in for the demo.",
                });
                onClose();
              }}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full justify-center gap-2 rounded-xl text-muted-foreground",
              )}
            >
              <LogOut className="size-3.5" aria-hidden />
              Sign out (mock)
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function HeaderStatusPill() {
  const { primaryBookingId, getBooking } = useCustomerWorkflow();
  if (!primaryBookingId) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/[0.1] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/25">
        Preview
      </span>
    );
  }
  const b = getBooking(primaryBookingId);
  const cancelled = b?.isCancelled;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1",
        cancelled
          ? "bg-amber-500/12 text-amber-600 ring-amber-500/30"
          : "bg-emerald-500/12 text-emerald-600 ring-emerald-500/30",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          cancelled ? "bg-amber-500" : "bg-emerald-500",
        )}
        aria-hidden
      />
      {cancelled ? "On hold" : "Live"}
    </span>
  );
}

function renderTabContent(activeTab: CustomerNavTab) {
  switch (activeTab) {
    case "dashboard":
      return <DashboardOverview />;
    case "visits":
      return <VisitsView />;
    case "messages":
      return <MessagesView />;
    case "payments":
      return <PaymentsView />;
    case "preferences":
      return <PreferencesView />;
    default:
      return <DashboardOverview />;
  }
}

function CustomerDashboardShell() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomerNavTab>("dashboard");
  const { registerNavigate, threads, pushToast } = useCustomerWorkflow();

  const unreadMessages = useMemo(() => threads.filter((t) => t.unread).length, [threads]);

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollPaddingBottom;
    const mq = window.matchMedia("(max-width: 767.98px)");
    const apply = () => {
      if (mq.matches) {
        html.style.scrollPaddingBottom = MOBILE_SCROLL_PADDING_BOTTOM_CSS;
      } else {
        html.style.scrollPaddingBottom = prev;
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      html.style.scrollPaddingBottom = prev;
    };
  }, []);

  const go = useCallback((tab: CustomerNavTab) => {
    setActiveTab(tab);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    registerNavigate(go);
    return () => registerNavigate(null);
  }, [go, registerNavigate]);

  const activeLabel = sidebarNavItems.find((n) => n.tab === activeTab)?.label ?? "Dashboard";
  const activeTitle = `${activeLabel} — your account`;

  return (
    <div
      className={cn(
        bp.pageRoot,
        "flex min-h-full flex-col pb-[max(5rem,env(safe-area-inset-bottom)+4.5rem)] md:pb-10",
      )}
    >
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 px-4 py-2 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={cn(bp.navWordmark, "tracking-tight")}>Shalean</p>
            <p className="truncate text-[11px] font-medium text-muted-foreground">{activeLabel}</p>
          </div>
          <HeaderStatusPill />
        </div>
      </header>

      <CustomerMoreDrawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        activeTab={activeTab}
        onSelect={go}
      />

      <div className="isolate mx-auto flex w-full max-w-6xl flex-1 flex-col gap-0 px-4 pt-4 sm:px-6 md:flex-row md:gap-8 md:pt-6 lg:gap-10">
        <aside
          className="relative z-10 hidden w-[232px] shrink-0 flex-col md:flex md:pt-0"
          aria-label="Sidebar"
        >
          <div className="sticky top-6 flex max-h-[calc(100dvh-2.5rem)] min-h-0 flex-col">
            <p className={cn(bp.navWordmark, "px-1")}>Shalean</p>
            <p className="booking-display mt-2 px-1 text-lg text-foreground">Your account</p>
            <p className="mt-0.5 px-1 text-[11px] leading-snug text-muted-foreground">Preview with sample data.</p>

            <div className="mt-3 px-1">
              <HeaderStatusPill />
            </div>

            <CustomerSidebarNav activeTab={activeTab} onSelect={go} unread={unreadMessages} />

            <div className="mt-auto space-y-2 border-t border-border/60 pt-3">
              <Link
                href="/prototype/booking"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "w-full justify-center gap-2 rounded-xl shadow-[0_2px_12px_-4px_rgba(53,99,255,0.35)]",
                )}
                onClick={() =>
                  pushToast({
                    tone: "primary",
                    title: "Booking flow opened",
                    body: "Continue your visit setup.",
                  })
                }
              >
                <Sparkles className="size-3.5" aria-hidden />
                New visit
              </Link>
              <Link
                href="/prototype"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full rounded-xl text-muted-foreground")}
              >
                Hub
              </Link>
            </div>
          </div>
        </aside>

        <main className="relative z-0 min-w-0 flex-1 pb-2 md:pb-0">
          <div
            key={activeTab}
            id={TAB_PANEL_ID}
            role="tabpanel"
            aria-label={activeTitle}
            className="mx-auto max-w-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-reduce:animate-none lg:max-w-none"
          >
            {renderTabContent(activeTab)}
          </div>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden"
        aria-label="Primary"
      >
        <CustomerBottomNav
          activeTab={activeTab}
          onSelect={go}
          onMoreOpen={() => setMoreOpen(true)}
          moreOpen={moreOpen}
          unread={unreadMessages}
        />
      </nav>

      <CustomerToastStack />
      <CustomerDetailSheet />
    </div>
  );
}

export function CustomerDashboardView() {
  return (
    <CustomerWorkflowProvider>
      <CustomerDashboardShell />
    </CustomerWorkflowProvider>
  );
}
