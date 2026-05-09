"use client";

import { CalendarOff, CircleDollarSign, Inbox, Sparkles } from "lucide-react";

import { EMPTY_STATE } from "@/lib/copy/copy-deck";

import { EmptyStateCard } from "./dashboard-primitives";

/**
 * Cleaner-side empty states. Each is a tiny binding from the centralized
 * `EMPTY_STATE` copy bank onto the shared `EmptyStateCard` primitive — that
 * keeps icon, ring tone, spacing, and typography identical across customer,
 * cleaner, and admin zero-data surfaces.
 */

export function CleanerEmptyNoVisitsToday({ className }: { className?: string }) {
  const copy = EMPTY_STATE.cleanerNoVisitsToday;
  return (
    <EmptyStateCard
      icon={CalendarOff}
      iconTone="primary"
      overline={copy.overline}
      title={copy.title}
      body={copy.body}
      className={className}
    />
  );
}

export function CleanerEmptyNoUpcoming({ className }: { className?: string }) {
  const copy = EMPTY_STATE.cleanerNoUpcoming;
  return (
    <EmptyStateCard
      icon={Sparkles}
      overline={copy.overline}
      title={copy.title}
      body={copy.body}
      className={className}
    />
  );
}

export function CleanerEmptyMessages({ className }: { className?: string }) {
  const copy = EMPTY_STATE.cleanerNoMessages;
  return (
    <EmptyStateCard
      icon={Inbox}
      overline={copy.overline}
      title={copy.title}
      body={copy.body}
      className={className}
    />
  );
}

export function CleanerEmptyEarnings({ className }: { className?: string }) {
  const copy = EMPTY_STATE.cleanerNoEarnings;
  return (
    <EmptyStateCard
      icon={CircleDollarSign}
      overline={copy.overline}
      title={copy.title}
      body={copy.body}
      className={className}
    />
  );
}
