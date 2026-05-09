"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  appendBookingOperationalNoteAction,
  type AdminOperationalNoteRow,
  type AppendOperationalNoteState,
} from "@/lib/admin/operations";

const initial: AppendOperationalNoteState = { ok: true };

function formatNoteTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function BookingOperationalNotesPanel(props: {
  bookingId: string;
  notes: AdminOperationalNoteRow[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(appendBookingOperationalNoteAction, initial);

  useEffect(() => {
    if (state.ok && state.message === "Note saved.") {
      router.refresh();
    }
  }, [router, state]);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
        <input type="hidden" name="booking_id" value={props.bookingId} />
        <div className="grid gap-2">
          <Label htmlFor={`note-kind-${props.bookingId}`}>Note type</Label>
          <select
            id={`note-kind-${props.bookingId}`}
            name="note_kind"
            defaultValue="support"
            disabled={pending}
            className="flex h-9 max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
          >
            <option value="support">Support context</option>
            <option value="operations">Operations</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`note-body-${props.bookingId}`}>Append note</Label>
          <Textarea
            id={`note-body-${props.bookingId}`}
            name="body"
            rows={3}
            disabled={pending}
            placeholder="Customer issue summary, escalation detail, internal coordination…"
            className="min-h-[88px] resize-y"
            maxLength={8000}
          />
          <p className="text-[11px] text-muted-foreground">
            Append-only — visible to dispatch/admin only. Does not replace customer-visible fields or lifecycle events.
          </p>
        </div>
        {state.ok === false && state.message ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        {state.ok && state.message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Add note"}
        </Button>
      </form>

      <ul className="space-y-3">
        {props.notes.length === 0 ? (
          <li className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
            No internal notes yet — add context for the next teammate on this booking.
          </li>
        ) : (
          props.notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-border/70 bg-card/40 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {n.note_kind === "operations" ? "Operations" : "Support"}
                </span>
                <time className="text-[11px] text-muted-foreground">{formatNoteTime(n.created_at)}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{n.body}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {n.author_display_name ?? "Staff"}{" "}
                <span className="font-mono opacity-80">({n.author_user_id.slice(0, 8)}…)</span>
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
