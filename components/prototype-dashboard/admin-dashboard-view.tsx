"use client";

import "./dashboard-prototype-motion.css";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Radar,
  Settings,
  Sparkles,
  Users,
  UserSquare2,
  X,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { bp } from "@/components/booking-prototype/visual-system";

import type { AdminNavTab } from "./admin-dashboard-ui";
import { AdminBookingsView } from "./admin-views/bookings-view";
import { AdminCleanersView } from "./admin-views/cleaners-view";
import { AdminCustomersView } from "./admin-views/customers-view";
import { AdminDispatchView } from "./admin-views/dispatch-view";
import { AdminEarningsView } from "./admin-views/earnings-view";
import { AdminInsightsView } from "./admin-views/insights-view";
import { AdminMessagesView } from "./admin-views/messages-view";
import { AdminOverviewView } from "./admin-views/overview-view";
import { AdminSettingsView } from "./admin-views/settings-view";
import { ADMIN_TODAY_HERO } from "./mock-admin-data";
import { AdminWorkflowProvider, useAdminWorkflow } from "./admin-workflow-context";
import { AdminToastStack } from "./admin-toast-stack";
import { AdminDetailSheet } from "./admin-detail-sheet";
import { MOBILE_FOOTER_OFFSET_CSS } from "./dashboard-primitives";

const TAB_PANEL_ID = "admin-tabpanel";

const MOBILE_FOOTER_OFFSET = MOBILE_FOOTER_OFFSET_CSS;

type NavIcon = typeof LayoutDashboard;

type SidebarNavItem = {
  tab: AdminNavTab;
  label: string;
  icon: NavIcon;
  description?: string;
};

type BottomPrimaryItem = {
  tab: AdminNavTab;
  label: string;
  icon: NavIcon;
};

const sidebarPrimaryItems: SidebarNavItem[] = [
  { tab: "overview", label: "Overview", icon: LayoutDashboard },
  { tab: "bookings", label: "Bookings", icon: CalendarRange },
  { tab: "dispatch", label: "Dispatch", icon: Radar },
  { tab: "cleaners", label: "Cleaners", icon: Users },
  { tab: "customers", label: "Customers", icon: UserSquare2 },
];

const sidebarSecondaryItems: SidebarNavItem[] = [
  { tab: "earnings", label: "Earnings", icon: CreditCard },
  { tab: "insights", label: "Insights", icon: BarChart3 },
  { tab: "messages", label: "Messages", icon: MessageSquare },
  { tab: "settings", label: "Settings", icon: Settings },
];

const bottomPrimaryItems: BottomPrimaryItem[] = [
  { tab: "overview", label: "Overview", icon: LayoutDashboard },
  { tab: "bookings", label: "Bookings", icon: CalendarRange },
  { tab: "dispatch", label: "Dispatch", icon: Radar },
  { tab: "cleaners", label: "Cleaners", icon: Users },
];

const moreSecondaryItems: SidebarNavItem[] = [
  { tab: "customers", label: "Customers", icon: UserSquare2, description: "Lifetime, recurring, flags" },
  { tab: "earnings", label: "Earnings", icon: CreditCard, description: "Revenue & cleaner payouts" },
  { tab: "insights", label: "Insights", icon: BarChart3, description: "Operational intelligence" },
  { tab: "messages", label: "Messages", icon: MessageSquare, description: "Support & cleaner inbox" },
  { tab: "settings", label: "Settings", icon: Settings, description: "Pricing, payouts, alerts" },
];

const SECONDARY_TAB_SET = new Set<AdminNavTab>(moreSecondaryItems.map((i) => i.tab));

const TITLE_BY_TAB: Record<AdminNavTab, string> = {
  overview: "Overview",
  bookings: "Bookings",
  dispatch: "Dispatch",
  cleaners: "Cleaners",
  customers: "Customers",
  earnings: "Earnings",
  insights: "Insights",
  messages: "Messages",
  settings: "Settings",
};

function AdminSidebarSection({
  heading,
  items,
  activeTab,
  onSelect,
  idPrefix,
}: {
  heading: string;
  items: SidebarNavItem[];
  activeTab: AdminNavTab;
  onSelect: (tab: AdminNavTab) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-[10px] font-medium uppercase tracking-[0.11em] text-muted-foreground">{heading}</p>
      <nav className="flex flex-col gap-0.5" role="tablist" aria-label={heading}>
        {items.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.tab;
          return (
            <button
              key={`${idPrefix}-${item.tab}`}
              type="button"
              role="tab"
              id={`${idPrefix}-${item.tab}`}
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
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function AdminBottomNav({
  activeTab,
  onSelect,
  onMoreOpen,
  moreOpen,
  unreadThreads,
}: {
  activeTab: AdminNavTab;
  onSelect: (tab: AdminNavTab) => void;
  onMoreOpen: () => void;
  moreOpen: boolean;
  unreadThreads: number;
}) {
  const moreActive = SECONDARY_TAB_SET.has(activeTab);

  return (
    <nav className="flex w-full items-stretch px-1" role="tablist" aria-label="Primary">
      {bottomPrimaryItems.map((item) => {
        const Icon = item.icon;
        const selected = activeTab === item.tab && !moreOpen;
        return (
          <button
            key={`bottom-${item.tab}`}
            type="button"
            role="tab"
            id={`admin-tab-bar-${item.tab}`}
            aria-selected={selected}
            aria-controls={TAB_PANEL_ID}
            onClick={() => onSelect(item.tab)}
            aria-label={`${item.label} tab`}
            className={cn(
              "group flex flex-1 cursor-pointer touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-medium",
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
            <span className="text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]">
              {item.label}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        id="admin-tab-bar-more"
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
            "relative flex size-9 items-center justify-center rounded-2xl motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
            (moreActive || moreOpen) &&
              "bg-primary/[0.12] shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
          )}
        >
          <MoreHorizontal
            className={cn("size-[1.15rem] shrink-0 stroke-[1.7]", (moreActive || moreOpen) && "text-primary")}
            aria-hidden
          />
          {unreadThreads > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[8.5px] font-bold leading-none text-white shadow-[0_0_0_2px_var(--background)]">
              {unreadThreads}
            </span>
          ) : null}
        </span>
        <span className="text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]">More</span>
      </button>
    </nav>
  );
}

function AdminMoreDrawer({
  open,
  onClose,
  activeTab,
  onSelect,
  onSecondaryAction,
}: {
  open: boolean;
  onClose: () => void;
  activeTab: AdminNavTab;
  onSelect: (tab: AdminNavTab) => void;
  onSecondaryAction: (id: "help" | "alerts" | "signout") => void;
}) {
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

  const handleSelect = (tab: AdminNavTab) => {
    onSelect(tab);
    onClose();
  };

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
            <p className="text-[11.5px] font-medium text-muted-foreground">Operations console</p>
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
              OP
            </div>
            <div className="min-w-0 flex-1">
              <p className="booking-display truncate text-[14.5px] leading-tight text-foreground">Operations</p>
              <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">Admin desk · Mock data only</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-500/30">
              <span
                className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.18)]"
                aria-hidden
              />
              Live
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-muted/25 px-2.5 py-2 ring-1 ring-border/55">
              <p className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Bookings</p>
              <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">
                {ADMIN_TODAY_HERO.bookingsToday}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/25 px-2.5 py-2 ring-1 ring-border/55">
              <p className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Active</p>
              <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">
                {ADMIN_TODAY_HERO.cleanersActive}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelect("dispatch")}
              className={cn(
                "flex flex-col items-start rounded-2xl px-2.5 py-2 text-left ring-1 motion-safe:transition-[background-color] motion-safe:duration-200 active:scale-[0.99]",
                ADMIN_TODAY_HERO.issuesActive > 0
                  ? "bg-rose-500/[0.08] text-rose-600 ring-rose-500/30 hover:bg-rose-500/[0.12] dark:text-rose-300"
                  : "bg-muted/25 ring-border/55 hover:bg-muted/40",
              )}
            >
              <p className="text-[9.5px] font-medium uppercase tracking-[0.08em] opacity-80">Issues</p>
              <p className="mt-0.5 text-[15px] font-semibold tabular-nums">{ADMIN_TODAY_HERO.issuesActive}</p>
            </button>
          </div>

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
                { id: "help", label: "Help & support", description: "Reach the platform team", icon: LifeBuoy },
                {
                  id: "alerts",
                  label: "Alert preferences",
                  description: "SLA, dispatch, payout",
                  icon: AlertTriangle,
                },
              ] as const
            ).map((it) => {
              const Icon = it.icon;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSecondaryAction(it.id);
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
              href="/prototype"
              onClick={onClose}
              className={cn(
                buttonVariants({ size: "sm" }),
                "w-full justify-center gap-2 rounded-xl shadow-[0_2px_12px_-4px_rgba(53,99,255,0.35)]",
              )}
            >
              <Sparkles className="size-3.5" aria-hidden />
              Prototype hub
            </Link>
            <Link
              href="/prototype/cleaner"
              onClick={onClose}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full justify-center rounded-xl text-muted-foreground",
              )}
            >
              Cleaner desk
            </Link>
            <button
              type="button"
              onClick={() => {
                onSecondaryAction("signout");
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

function renderTabContent(activeTab: AdminNavTab) {
  switch (activeTab) {
    case "overview":
      return <AdminOverviewView />;
    case "bookings":
      return <AdminBookingsView />;
    case "dispatch":
      return <AdminDispatchView />;
    case "cleaners":
      return <AdminCleanersView />;
    case "customers":
      return <AdminCustomersView />;
    case "earnings":
      return <AdminEarningsView />;
    case "insights":
      return <AdminInsightsView />;
    case "messages":
      return <AdminMessagesView />;
    case "settings":
      return <AdminSettingsView />;
    default:
      return <AdminOverviewView />;
  }
}

export function AdminDashboardView() {
  return (
    <AdminWorkflowProvider>
      <AdminDashboardShell />
    </AdminWorkflowProvider>
  );
}

function AdminDashboardShell() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminNavTab>("overview");
  const { registerNavigate, pushToast, state } = useAdminWorkflow();

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollPaddingBottom;
    const mq = window.matchMedia("(max-width: 767.98px)");
    const apply = () => {
      if (mq.matches) {
        html.style.scrollPaddingBottom = "max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 4.75rem))";
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

  const go = useCallback((tab: AdminNavTab) => {
    setActiveTab(tab);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    registerNavigate(go);
  }, [registerNavigate, go]);

  const unreadThreads = Object.values(state.threads).filter((t) => t.unread && !t.resolved).length;
  const openIssues = Object.values(state.bookings).filter(
    (b) =>
      b.status === "cancelled" ||
      b.status === "matching_cleaner" ||
      (b.riskFlags?.length ?? 0) > 0,
  ).length;

  const activeLabel = TITLE_BY_TAB[activeTab];
  const activeTitle = `${activeLabel} — operations`;

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
            <p className="truncate text-[11px] font-medium text-muted-foreground">Ops · {activeLabel}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {openIssues > 0 ? (
              <button
                type="button"
                onClick={() => go("dispatch")}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-600 ring-1 ring-rose-500/30"
              >
                <span className="size-1.5 rounded-full bg-rose-500" aria-hidden />
                {openIssues} issue{openIssues === 1 ? "" : "s"}
              </button>
            ) : null}
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-500/30">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              Live
            </span>
          </div>
        </div>
      </header>

      <AdminMoreDrawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        activeTab={activeTab}
        onSelect={go}
        onSecondaryAction={(id) => {
          if (id === "help") {
            pushToast({ tone: "info", title: "Help requested", body: "Platform team will reach out." });
          } else if (id === "alerts") {
            go("settings");
          } else if (id === "signout") {
            pushToast({ tone: "warning", title: "Sign out (mock)", body: "Demo prototype only." });
          }
        }}
      />

      <div className="isolate mx-auto flex w-full max-w-7xl flex-1 flex-col gap-0 px-4 pt-4 sm:px-6 md:flex-row md:gap-8 md:pt-6 lg:gap-10">
        <aside
          className="relative z-10 hidden w-[244px] shrink-0 flex-col md:flex md:pt-0"
          aria-label="Sidebar"
        >
          <div className="sticky top-6 flex max-h-[calc(100dvh-2.5rem)] min-h-0 flex-col">
            <p className={cn(bp.navWordmark, "px-1")}>Shalean</p>
            <p className="booking-display mt-2 px-1 text-lg text-foreground">Ops console</p>
            <p className="mt-0.5 px-1 text-[11px] leading-snug text-muted-foreground">
              Operational control · mock data
            </p>

            <div className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto pr-0.5">
              <AdminSidebarSection
                heading="Operate"
                items={sidebarPrimaryItems}
                activeTab={activeTab}
                onSelect={go}
                idPrefix="admin-rail-primary"
              />
              <AdminSidebarSection
                heading="Insight & control"
                items={sidebarSecondaryItems}
                activeTab={activeTab}
                onSelect={go}
                idPrefix="admin-rail-secondary"
              />
            </div>

            <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
              <Link
                href="/prototype/booking"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "w-full justify-center gap-2 rounded-xl shadow-[0_2px_12px_-4px_rgba(53,99,255,0.35)]",
                )}
              >
                <Sparkles className="size-3.5" aria-hidden />
                Booking flow
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
        <AdminBottomNav
          activeTab={activeTab}
          onSelect={go}
          onMoreOpen={() => setMoreOpen(true)}
          moreOpen={moreOpen}
          unreadThreads={unreadThreads}
        />
      </nav>

      <AdminToastStack />
      <AdminDetailSheet />
    </div>
  );
}
