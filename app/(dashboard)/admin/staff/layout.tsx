import Link from "next/link";

import { OperationalHubNav } from "@/components/admin/operational-hub-nav";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-0">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Staff administration</h1>
          <p className="text-sm text-muted-foreground">
            Admin-only tools. Role changes update JWT app_metadata (authorization truth); profiles sync via database triggers.
          </p>
          <div className="mt-2">
            <OperationalHubNav />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            prefetch={false}
            href="/dashboard"
            className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Dashboard
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
