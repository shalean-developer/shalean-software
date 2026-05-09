"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { signInAction } from "../actions";
import type { AuthActionState } from "../types";

const initial: AuthActionState = { ok: true };

export function LoginForm({ defaultNext }: { defaultNext?: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signInAction, initial);

  useEffect(() => {
    if (state.ok && state.navigateTo) {
      router.replace(state.navigateTo);
    }
  }, [router, state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultNext ? <input type="hidden" name="next" value={defaultNext} /> : null}
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      {state.ok === false && state.message ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
