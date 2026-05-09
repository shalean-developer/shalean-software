import Link from "next/link";

import { LoginForm } from "@/lib/auth/components/login-form";
import { resolveSafeInternalRedirect } from "@/lib/auth/safe-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; next?: string }>;
}) {
  const { notice, next } = await searchParams;
  const nextSafe = resolveSafeInternalRedirect(typeof next === "string" ? next : null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Use the email and password for your account.
        </p>
      </div>
      {notice === "verify_email" ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          Check your inbox to verify your email, then sign in.
        </p>
      ) : null}
      {nextSafe ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          After you sign in, we&apos;ll take you back to continue where you left off.
        </p>
      ) : null}
      <LoginForm defaultNext={nextSafe ?? undefined} />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link
          href={nextSafe ? `/signup?next=${encodeURIComponent(nextSafe)}` : "/signup"}
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
