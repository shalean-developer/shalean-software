"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { adminBookingLifecycleAction } from "@/lib/admin/operations";
import type { AdminCleanerOption } from "@/lib/admin/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllowedNextStatuses, isBookingStatus, type BookingStatus } from "@/lib/bookings/lifecycle";
import { adminTransitionTargetLabel } from "@/lib/operations/workforce-copy";
import { lifecycleTransitionRecoveryHint } from "@/lib/operational/reliability";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full touch-manipulation sm:w-auto sm:min-w-[200px]">
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Applying…
        </span>
      ) : (
        "Apply transition"
      )}
    </Button>
  );
}

function BookingOpsFormInner(props: {
  bookingId: string;
  rowVersion: number;
  cleaners: AdminCleanerOption[];
  hasReconciliationConflict: boolean;
  targets: BookingStatus[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(adminBookingLifecycleAction, { ok: true } as const);
  const [target, setTarget] = useState<BookingStatus>(() => props.targets[0]!);

  useEffect(() => {
    if (state.ok && state.message === "Saved.") {
      router.refresh();
    }
  }, [state, router]);

  const recoveryHint = state.ok === false ? lifecycleTransitionRecoveryHint(state.code) : null;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="booking_id" value={props.bookingId} />
      <input type="hidden" name="expected_row_version" value={String(props.rowVersion)} />

      <p className="text-sm leading-relaxed text-muted-foreground">
        Same centralized updater customers and cleaners use — row version prevents overwriting teammates. When assigning,
        pick the cleaner who owns the slot; you can change assignment later with another transition if policy allows.
      </p>

      <div className="grid gap-5">
        <div className="grid gap-2 sm:max-w-md">
          <Label htmlFor="next_status">Move booking to</Label>
          <select
            id="next_status"
            name="next_status"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value as BookingStatus)}
            className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {props.targets.map((s) => (
              <option key={s} value={s}>
                {adminTransitionTargetLabel(s)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Honours centralized lifecycle rules and optimistic concurrency.</p>
        </div>

        {target === "assigned" ? (
          <div className="grid gap-2 sm:max-w-md">
            <Label htmlFor="assign_cleaner_id">Assign cleaner</Label>
            <select
              id="assign_cleaner_id"
              name="assign_cleaner_id"
              required
              defaultValue=""
              className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Select cleaner…
              </option>
              {props.cleaners.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name?.trim() || `Cleaner ${c.id.slice(0, 8)}…`}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Active cleaners only — confirm workload on the operations board &quot;Active pipeline&quot; queue if needed.
            </p>
          </div>
        ) : null}

        {target === "cancelled" ? (
          <div className="grid gap-2 sm:max-w-lg">
            <Label htmlFor="cancel_reason">Cancel reason (optional)</Label>
            <Input id="cancel_reason" name="cancel_reason" maxLength={4000} placeholder="Reason for audit trail" />
          </div>
        ) : null}

        {props.hasReconciliationConflict ? (
          <div className="space-y-3 rounded-xl border border-amber-600/35 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">Reconciliation attention</p>
            <p className="text-sm text-muted-foreground">
              A payment shows <strong>succeeded</strong> while this booking is not <strong>paid</strong>. Most transitions
              are limited until payment state aligns — you can still heal <strong>awaiting_payment → paid</strong> when
              appropriate, or use break-glass only if configured.
            </p>
            <div className="grid gap-2 sm:max-w-md">
              <Label htmlFor="reconciliation_override">Break-glass token (optional)</Label>
              <Input
                id="reconciliation_override"
                name="reconciliation_override"
                type="password"
                autoComplete="off"
                placeholder="Server-configured override only"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for normal flows. Never share this token outside ops break-glass procedures.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {state.ok === false && state.message ? (
        <div className="rounded-xl border border-destructive/35 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
          <p>{state.message}</p>
          {recoveryHint ? (
            <p className="mt-3 border-t border-destructive/20 pt-3 text-xs leading-relaxed text-foreground">{recoveryHint}</p>
          ) : null}
          {state.code ? (
            <details className="mt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Diagnostics</summary>
              <p className="mt-2 font-mono">{state.code}</p>
            </details>
          ) : null}
        </div>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

export function BookingOpsForm(props: {
  bookingId: string;
  rowVersion: number;
  currentStatus: string;
  cleaners: AdminCleanerOption[];
  hasReconciliationConflict: boolean;
}) {
  const targets = useMemo(() => {
    if (!isBookingStatus(props.currentStatus)) return [] as BookingStatus[];
    const next = getAllowedNextStatuses(props.currentStatus);
    return next.filter((s) => s !== props.currentStatus);
  }, [props.currentStatus]);

  if (targets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No lifecycle transitions are available from this status.
      </p>
    );
  }

  return (
    <BookingOpsFormInner
      key={`${props.bookingId}-${props.rowVersion}-${props.currentStatus}`}
      bookingId={props.bookingId}
      rowVersion={props.rowVersion}
      cleaners={props.cleaners}
      hasReconciliationConflict={props.hasReconciliationConflict}
      targets={targets}
    />
  );
}
