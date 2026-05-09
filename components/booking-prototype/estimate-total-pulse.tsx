"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Soft highlight when a numeric estimate changes — sticky rail, review, checkout.
 */
export function EstimateTotalPulse({
  value,
  className,
  children,
}: {
  value: number;
  className?: string;
  children: React.ReactNode;
}) {
  const prev = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 520);
    return () => window.clearTimeout(t);
  }, [value]);

  return (
    <span
      className={cn(
        "inline-block tabular-nums motion-safe:transition-[box-shadow,transform,color] motion-safe:duration-300 motion-reduce:transition-none",
        pulse &&
          "rounded-md shadow-[0_0_0_3px_rgba(53,99,255,0.14)] motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </span>
  );
}
