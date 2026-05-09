import type { StaffRoleAuditRow } from "@/lib/admin/staff-roles/queries";

export function StaffRoleAuditTable({ rows }: { rows: StaffRoleAuditRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No audit entries yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th className="px-3 py-2 font-medium">When</th>
            <th className="px-3 py-2 font-medium">Subject</th>
            <th className="px-3 py-2 font-medium">Change</th>
            <th className="px-3 py-2 font-medium">Actor</th>
            <th className="px-3 py-2 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-muted-foreground">
                {r.created_at}
              </td>
              <td className="px-3 py-2 font-mono text-[11px]">{r.subject_user_id}</td>
              <td className="px-3 py-2 capitalize">
                {r.previous_role} → {r.new_role}
              </td>
              <td className="px-3 py-2 font-mono text-[11px]">{r.actor_user_id}</td>
              <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground" title={r.reason ?? undefined}>
                {r.reason ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
