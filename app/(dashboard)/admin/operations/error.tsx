"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminOperationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
      <p className="font-medium text-destructive">Operations failed to load</p>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => reset()}>
          Retry
        </Button>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex items-center justify-center")}
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
