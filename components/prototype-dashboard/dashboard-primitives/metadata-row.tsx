"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface MetadataItem {
  /** Stable key for React. */
  key: string;
  /** Optional leading icon (defaults to none). */
  icon?: IconType;
  /** Body content. Strings get the right truncation; nodes flow through. */
  children: ReactNode;
  /** Tone — defaults to muted body text. */
  tone?: "muted" | "foreground" | "primary";
}

interface MetadataRowProps {
  items: MetadataItem[];
  /** Override gap/wrap behaviour if needed. */
  className?: string;
}

const TONE_CLASS = {
  muted: "text-muted-foreground",
  foreground: "text-foreground",
  primary: "text-primary",
} as const;

/**
 * Calm horizontal "icon + text · icon + text · …" row used in card metadata
 * (date · arrival · duration · address). Wraps gracefully and keeps icon
 * alignment + tabular numerals consistent across booking, customer, cleaner,
 * and admin surfaces.
 */
export function MetadataRow({ items, className }: MetadataRowProps) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const tone = TONE_CLASS[item.tone ?? "muted"];
        return (
          <span key={item.key} className={cn("inline-flex items-center gap-1.5", tone)}>
            {Icon ? (
              <Icon className="size-3.5 shrink-0 text-primary/80" strokeWidth={1.7} aria-hidden />
            ) : null}
            <span className="min-w-0">{item.children}</span>
          </span>
        );
      })}
    </div>
  );
}
