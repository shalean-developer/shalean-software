import Link from "next/link";

import {
  listRecentStaffRoleAudit,
  listStaffDirectoryPage,
} from "@/lib/admin/staff-roles/queries";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

import { StaffRoleAuditTable } from "./staff-role-audit-table";
import { StaffRoleDirectory } from "./staff-role-directory";

export default async function StaffRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [directory, client] = await Promise.all([
    listStaffDirectoryPage({ page, perPage: 40 }),
    createServerSupabaseClient(),
  ]);

  const audit = await listRecentStaffRoleAudit(client, 40);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">JWT role</span> is what authorization uses today;{" "}
            <span className="font-medium text-foreground">Profile role</span> should match after sync. Subjects must sign
            out/in or refresh the session to pick up a new JWT.
          </p>
        </div>
        {!directory.ok ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {directory.message}
          </p>
        ) : (
          <>
            <StaffRoleDirectory rows={directory.rows} />
            <PaginationFooter
              page={directory.page}
              total={directory.total}
              perPage={directory.perPage}
              rowCount={directory.rows.length}
            />
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Recent role changes</h2>
        {!audit.ok ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            Audit log unavailable: {audit.message}. Apply migration{" "}
            <code className="rounded bg-muted px-1 text-xs">supabase/migrations/20260508204500_staff_role_audit.sql</code>{" "}
            if missing.
          </p>
        ) : (
          <StaffRoleAuditTable rows={audit.rows} />
        )}
      </section>
    </div>
  );
}

function PaginationFooter({
  page,
  total,
  perPage,
  rowCount,
}: {
  page: number;
  total: number | null;
  perPage: number;
  rowCount: number;
}) {
  const hasPrev = page > 1;
  const hasNext =
    total !== null ? page * perPage < total : rowCount >= perPage;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>
        {total !== null ? (
          <>
            Page {page} — {total} user{total === 1 ? "" : "s"} total
          </>
        ) : (
          <>Page {page}</>
        )}
      </span>
      <div className="flex gap-3">
        {hasPrev ? (
          <Link
            prefetch={false}
            href={page <= 2 ? "/admin/staff/roles" : `/admin/staff/roles?page=${page - 1}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Previous
          </Link>
        ) : (
          <span className="opacity-40">Previous</span>
        )}
        {hasNext ? (
          <Link
            prefetch={false}
            href={`/admin/staff/roles?page=${page + 1}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Next
          </Link>
        ) : (
          <span className="opacity-40">Next</span>
        )}
      </div>
    </div>
  );
}
