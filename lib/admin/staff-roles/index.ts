/**
 * Staff role management (admin-only)
 * -----------------------------
 * Authorization truth: JWT `app_metadata.role` (updated via GoTrue Admin API + service role).
 * Operational mirror: `public.users.role` (kept in sync by `private.handle_auth_user_sync` on auth.users).
 *
 * Flow: admin submits form → server action verifies JWT admin → service role updates auth user
 * → DB trigger updates `public.users` → append-only `staff_role_audit` row (service_role insert).
 *
 * Do not expose role mutation to the browser Supabase client; RLS blocks `public.users.role`
 * updates for the `authenticated` role by design.
 */

export { updateStaffRoleAction, type StaffRoleActionState } from "./actions";
export {
  listStaffDirectoryPage,
  listRecentStaffRoleAudit,
  type StaffDirectoryRow,
  type StaffRoleAuditRow,
} from "./queries";
export { parseUpdateStaffRoleFromFormData, updateStaffRoleFormSchema } from "./schema";
