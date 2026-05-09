import Link from "next/link";

import { SignupForm } from "@/lib/auth/components/signup-form";
import { resolveSafeInternalRedirect } from "@/lib/auth/safe-redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextSafe = resolveSafeInternalRedirect(typeof next === "string" ? next : null);
  const loginHref = nextSafe ? `/login?next=${encodeURIComponent(nextSafe)}` : "/login";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Create account</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Book and manage cleaning visits with one secure sign-in. Staff accounts are provisioned separately by your
          team.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Sign in
        </Link>
      </p>
    </div>
  );
}
