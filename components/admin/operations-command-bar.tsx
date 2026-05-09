"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminOperationsHref } from "@/lib/admin/operations/dispatcher-queue-shared";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "shalean_ops_recent_bookings_v1";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RecentEntry = { id: string; at: string };

function readRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is RecentEntry => {
        if (!x || typeof x !== "object") return false;
        const o = x as Record<string, unknown>;
        return typeof o.id === "string" && typeof o.at === "string";
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}

/** Dispatcher workflow shortcuts — local persistence only; no operational truth duplicated. */
export function OperationsCommandBar(props: { className?: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  const trimmed = input.trim();
  const validUuid = useMemo(() => UUID_RE.test(trimmed), [trimmed]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validUuid) return;
    router.push(`/admin/operations/${trimmed}`);
    setInput("");
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/40 p-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3",
        props.className,
      )}
    >
      <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="ops-jump-booking">
          Jump to booking ID
        </label>
        <Input
          id="ops-jump-booking"
          placeholder="Booking UUID…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="font-mono text-xs sm:max-w-md"
          autoComplete="off"
        />
        <Button type="submit" size="sm" disabled={!validUuid}>
          Open booking
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3 sm:mt-0 sm:border-0 sm:pt-0">
        <Link
          href="/admin/operations/digest"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}
        >
          Daily digest
        </Link>
        <Link
          href={adminOperationsHref({ queue: "needs_assignment" })}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}
        >
          Needs cleaner
        </Link>
        <Link href="/admin/monitoring" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}>
          Monitoring
        </Link>
      </div>

      {recent.length > 0 ? (
        <div className="mt-3 w-full border-t border-border/60 pt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Recent bookings (this browser)
          </p>
          <ul className="flex flex-wrap gap-2">
            {recent.slice(0, 8).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/operations/${r.id}`}
                  className="inline-block max-w-[140px] truncate rounded-md border border-border/70 bg-muted/20 px-2 py-1 font-mono text-[11px] text-primary underline-offset-4 hover:underline"
                  title={r.id}
                >
                  {r.id.slice(0, 8)}…
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
