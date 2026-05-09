"use client";

import type { StaffDirectoryRow } from "@/lib/admin/staff-roles/queries";

import { StaffRoleRowForm } from "./staff-role-row-form";

export function StaffRoleDirectory({ rows }: { rows: StaffDirectoryRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No users in this page.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th className="px-3 py-2 font-medium">User</th>
            <th className="px-3 py-2 font-medium">JWT role</th>
            <th className="px-3 py-2 font-medium">Profile role</th>
            <th className="px-3 py-2 font-medium">Drift</th>
            <th className="px-3 py-2 font-medium">Change role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2 align-top">
                <div className="font-mono text-[11px] text-muted-foreground">{row.id}</div>
                <div className="mt-0.5">{row.email ?? "—"}</div>
                {row.display_name ? (
                  <div className="text-xs text-muted-foreground">{row.display_name}</div>
                ) : null}
              </td>
              <td className="px-3 py-2 align-top capitalize">{row.jwt_role}</td>
              <td className="px-3 py-2 align-top capitalize">{row.profile_role ?? "—"}</td>
              <td className="px-3 py-2 align-top">
                {row.profile_role !== null && row.profile_role !== row.jwt_role ? (
                  <span className="text-amber-700 dark:text-amber-400">Yes</span>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </td>
              <td className="px-3 py-2 align-top">
                <StaffRoleRowForm subjectUserId={row.id} currentRole={row.jwt_role} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
