"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  cleanerAdvanceButtonLabel,
  cleanerBookingLifecycleAction,
  type CleanerLifecycleActionState,
} from "@/lib/cleaner/operations";
import { isBookingStatus, type BookingStatus } from "@/lib/bookings/lifecycle";
import { cn } from "@/lib/utils";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      size="lg"
      className={cn(
        "h-12 min-h-12 w-full touch-manipulation text-base font-semibold",
        "shadow-sm active:translate-y-px",
      )}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Updating…
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

export function CleanerBookingAdvanceForm(props: {
  bookingId: string;
  rowVersion: number;
  currentStatus: string;
  nextStatus: BookingStatus;
  className?: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(cleanerBookingLifecycleAction, {
    ok: true,
  } as CleanerLifecycleActionState);

  useEffect(() => {
    if (state.ok && state.message === "Saved.") {
      router.refresh();
    }
  }, [state, router]);

  if (!isBookingStatus(props.currentStatus)) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Unrecognized booking status.
      </p>
    );
  }

  const label = cleanerAdvanceButtonLabel(props.nextStatus);

  return (
    <form action={formAction} className={cn("space-y-3", props.className)}>
      <input type="hidden" name="booking_id" value={props.bookingId} />
      <input type="hidden" name="expected_row_version" value={String(props.rowVersion)} />
      <input type="hidden" name="next_status" value={props.nextStatus} />

      {state.ok === false && state.message ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label={label} />

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Only tap once — updates sync to dispatch in a few seconds. If nothing changes, refresh and try again.
      </p>
    </form>
  );
}
