import Link from "next/link";

import { OperationalHubNav } from "@/components/admin/operational-hub-nav";
import { OperationsCommandBar } from "@/components/admin/operations-command-bar";
import { logTemporaryRoleResolution } from "@/lib/auth/role-debug";
import { getServerUser, requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export default async function AdminOperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preUser = await getServerUser();
  if (preUser) {
    const client = await createServerSupabaseClient();
    await logTemporaryRoleResolution({
      surface: "admin_operations_layout",
      user: preUser,
      client,
      extra: { guard: "dispatcher_shell" },
    });
  }
  await requireRole("dispatcher");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-0">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Operations</h1>
          <p className="text-sm text-muted-foreground">
            Dispatcher / admin — bookings, assignments, lifecycle, reconciliation signals.
          </p>
          <div className="mt-2">
            <OperationalHubNav current="operations" />
          </div>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
      <OperationsCommandBar />
      {children}
    </div>
  );
}
