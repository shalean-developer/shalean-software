"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import {
  updateStaffRoleAction,
  type StaffRoleActionState,
} from "@/lib/admin/staff-roles/actions";
import type { AppRole } from "@/lib/auth/types";

const roles: AppRole[] = ["customer", "cleaner", "dispatcher", "admin"];

const initial: StaffRoleActionState = { ok: true };

export function StaffRoleRowForm({
  subjectUserId,
  currentRole,
}: {
  subjectUserId: string;
  currentRole: AppRole;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(updateStaffRoleAction, initial);

  useEffect(() => {
    if (state.ok && state.message && !state.message.startsWith("No change")) {
      router.refresh();
      formRef.current?.reset();
    }
  }, [router, state]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-xs flex-col gap-2">
      <input type="hidden" name="subject_user_id" value={subjectUserId} />
      <select
        name="next_role"
        defaultValue={currentRole}
        disabled={pending}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs disabled:opacity-50"
        aria-label="New role"
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="reason"
        placeholder="Reason (optional)"
        disabled={pending}
        maxLength={500}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Saving…" : "Apply"}
      </button>
      {state.ok === false ? (
        <p className="text-xs text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
