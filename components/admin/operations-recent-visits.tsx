"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "shalean_ops_recent_bookings_v1";
const MAX = 8;

/** Records booking opens in localStorage for “resume where you left off” — not synced. */
export function OperationsRecentVisitTracker(props: { bookingId: string }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const id = props.bookingId;
    if (!id) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev = raw ? (JSON.parse(raw) as { id: string; at: string }[]) : [];
      const list = Array.isArray(prev) ? prev : [];
      const next = [{ id, at: new Date().toISOString() }, ...list.filter((x) => x?.id !== id)].slice(0, MAX);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / privacy mode */
    }
  }, [props.bookingId]);

  return null;
}
