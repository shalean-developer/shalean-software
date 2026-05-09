import Link from "next/link";

import { logTemporaryRoleResolution } from "@/lib/auth/role-debug";
import { getServerSession } from "@/lib/auth/session";
import { userHasAtLeastRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getServerSession();
  const signedIn = user !== null;
  const showOps = user !== null && userHasAtLeastRole(user, "dispatcher");
  const showStaffAdmin = user !== null && userHasAtLeastRole(user, "admin");
  const showCleanerJobs = user !== null && userHasAtLeastRole(user, "cleaner");

  if (user) {
    const client = await createServerSupabaseClient();
    await logTemporaryRoleResolution({
      surface: "dashboard_layout",
      user,
      client,
      extra: {
        nav_show_ops: showOps,
        nav_show_staff_admin: showStaffAdmin,
        nav_show_cleaner_jobs: showCleanerJobs,
      },
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-4 sm:px-6 dark:border-zinc-800">
        <Link
          prefetch={false}
          href="/dashboard"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Shalean
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {showOps ? (
            <>
              <Link
                prefetch={false}
                href="/admin/operations"
                className="font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
              >
                Operations
              </Link>
              <Link
                prefetch={false}
                href="/admin/monitoring"
                className="font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
              >
                Monitoring
              </Link>
              <Link
                prefetch={false}
                href="/admin/support"
                className="font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
              >
                Support
              </Link>
              <Link
                prefetch={false}
                href="/admin/analytics"
                className="font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
              >
                Analytics
              </Link>
              {showStaffAdmin ? (
                <Link
                  prefetch={false}
                  href="/admin/staff/roles"
                  className="font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
                >
                  Staff roles
                </Link>
              ) : null}
            </>
          ) : null}
          {showCleanerJobs ? (
            <Link
              prefetch={false}
              href="/cleaner/jobs"
              className="font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              My jobs
            </Link>
          ) : null}
          {signedIn ? (
            <Link
              prefetch={false}
              href="/bookings"
              className="font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              My bookings
            </Link>
          ) : null}
          <Link
            prefetch={false}
            href="/bookings/new"
            className="font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
          >
            New booking
          </Link>
        </nav>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
