"use client";

import {
  BellOff,
  CircleDollarSign,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { EMPTY_STATE } from "@/lib/copy/copy-deck";

import { EmptyStateCard } from "./dashboard-primitives";

/**
 * Admin-side empty states. Mirrors the cleaner / customer pattern — each
 * surface is a tiny binding from `EMPTY_STATE` copy onto the shared
 * `EmptyStateCard` primitive so dispatch / alerts / insights / payouts /
 * earnings all read with the same calm operational voice.
 */

export function AdminEmptyDispatch({ className }: { className?: string }) {
  const copy = EMPTY_STATE.adminNoDispatch;
  return (
    <EmptyStateCard
      icon={Radar}
      iconTone="primary"
      overline={copy.overline}
      title={copy.title}
      body={copy.body}
      className={className}
    />
  );
}

export function AdminEmptyAlerts({ className }: { className?: string }) {
  const copy = EMPTY_STATE.adminNoAlerts;
  return (
    <EmptyStateCard
      icon={ShieldCheck}
      overline={copy.overline}
      title={copy.title}
      body={copy.body}
      className={className}
    />
  );
}

export function AdminEmptyInsights({ className }: { className?: string }) {
  const copy = EMPTY_STATE.adminNoInsights;
  return (
    <EmptyStateCard
      icon={Sparkles}
      iconTone="primary"
      overline={copy.overline}
      title={copy.title}
      body={copy.body}
      className={className}
    />
  );
}

export function AdminEmptyPayouts({ className }: { className?: string }) {
  const copy = EMPTY_STATE.adminNoPayouts;
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

export function AdminEmptyEarnings({ className }: { className?: string }) {
  const copy = EMPTY_STATE.adminNoEarnings;
  return (
    <EmptyStateCard
      icon={BellOff}
      overline={copy.overline}
      title={copy.title}
      body={copy.body}
      className={className}
    />
  );
}
