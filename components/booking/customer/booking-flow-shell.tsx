import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BookingFlowShellProps = {
  step: 1 | 2 | 3;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function BookingFlowShell({ step, title, description, children, actions }: BookingFlowShellProps) {
  const labels = ["Details", "Confirm", "Paid"] as const;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 pb-28 lg:pb-10">
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Step {step} of 3 · {labels[step - 1]}
          </p>
          <div className="flex gap-1.5" role="list" aria-label="Booking progress">
            {([1, 2, 3] as const).map((n) => (
              <span
                key={n}
                role="listitem"
                className={cn(
                  "h-1.5 min-w-0 flex-1 rounded-full transition-colors",
                  n <= step ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
