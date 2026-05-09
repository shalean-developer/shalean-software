-- Allow dispatcher/admin read-only visibility into notification_outbox for operational analytics.
-- Writes remain service_role-only (no INSERT/UPDATE policies for authenticated).

DROP POLICY IF EXISTS notification_outbox_deny_authenticated ON public.notification_outbox;

CREATE POLICY notification_outbox_select_dispatcher_admin
  ON public.notification_outbox
  FOR SELECT
  TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

-- Table-level SELECT is required in addition to RLS (see REVOKE ALL FROM authenticated in 20260508193000).
GRANT SELECT ON TABLE public.notification_outbox TO authenticated;

COMMENT ON POLICY notification_outbox_select_dispatcher_admin ON public.notification_outbox IS
  'Stage 15A analytics: staff read outbox status counts; mutations stay service_role/triggers.';
