-- Append-only audit trail for staff role changes (authorization truth remains JWT app_metadata.role).
-- Inserts: server-side service_role only (bypasses RLS).
-- Selects: JWT admin only (operational review from app).

CREATE TABLE public.staff_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  previous_role public.user_role NOT NULL,
  new_role public.user_role NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX staff_role_audit_created_at_idx ON public.staff_role_audit (created_at DESC);
CREATE INDEX staff_role_audit_subject_idx ON public.staff_role_audit (subject_user_id);

COMMENT ON TABLE public.staff_role_audit IS
  'Staff role promotions/demotions; mirrors auth app_metadata.role updates. Insert via service_role only.';

ALTER TABLE public.staff_role_audit ENABLE ROW LEVEL SECURITY;

-- Authenticated clients cannot insert (service_role bypasses RLS).
CREATE POLICY staff_role_audit_select_admin
  ON public.staff_role_audit
  FOR SELECT
  TO authenticated
  USING (public.jwt_is_admin());

GRANT SELECT ON public.staff_role_audit TO authenticated;
