-- Row Level Security for operational tables
-- - Elevated roles (dispatcher, admin) are derived ONLY from JWT app_metadata.role (never user_metadata)
-- - Cleaner/customer access uses public.users.role (server-synced from app_metadata via private.handle_auth_user_sync)
-- - booking_events: SELECT for authorized viewers; INSERT/UPDATE/DELETE only via trigger (SECURITY DEFINER lifecycle emitter)
-- - Bookings/payments writes remain compatible with Supabase SSR + createServerSupabaseClient (authenticated JWT)

-- ---------------------------------------------------------------------------
-- 1) Lifecycle emitter: SECURITY DEFINER so INSERT into booking_events bypasses RLS
--    (invoker stays authenticated on bookings INSERT/UPDATE; trigger must not fail RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bookings_emit_lifecycle_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type public.booking_event_type;
  v_payload jsonb;
BEGIN
  IF tg_op = 'INSERT' THEN
    INSERT INTO public.booking_events (booking_id, event_type, actor_user_id, payload)
    VALUES (
      NEW.id,
      'BOOKING_CREATED',
      NEW.customer_id,
      jsonb_build_object(
        'status', NEW.status::text,
        'scheduled_start', NEW.scheduled_start,
        'scheduled_end', NEW.scheduled_end
      )
    );
    RETURN NEW;
  END IF;

  IF tg_op = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_payload := jsonb_build_object(
      'from', OLD.status::text,
      'to', NEW.status::text
    );

    v_type := CASE NEW.status
      WHEN 'paid' THEN 'PAYMENT_RECEIVED'::public.booking_event_type
      WHEN 'assigned' THEN 'BOOKING_ASSIGNED'::public.booking_event_type
      WHEN 'cleaner_en_route' THEN 'CLEANER_EN_ROUTE'::public.booking_event_type
      WHEN 'in_progress' THEN 'BOOKING_STARTED'::public.booking_event_type
      WHEN 'completed' THEN 'BOOKING_COMPLETED'::public.booking_event_type
      WHEN 'cancelled' THEN 'BOOKING_CANCELLED'::public.booking_event_type
      WHEN 'refunded' THEN 'BOOKING_REFUNDED'::public.booking_event_type
      ELSE NULL
    END;

    IF v_type IS NOT NULL THEN
      IF NEW.status = 'assigned' AND NEW.cleaner_id IS NOT NULL THEN
        v_payload := v_payload || jsonb_build_object('cleaner_id', NEW.cleaner_id);
      END IF;

      INSERT INTO public.booking_events (booking_id, event_type, actor_user_id, payload)
      VALUES (NEW.id, v_type, NULL, v_payload);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.bookings_emit_lifecycle_event() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.bookings_emit_lifecycle_event() FROM PUBLIC;

COMMENT ON FUNCTION public.bookings_emit_lifecycle_event IS
  'Emits booking_events from bookings mutations; SECURITY DEFINER so RLS does not block trigger-owned inserts.';

-- ---------------------------------------------------------------------------
-- 2) JWT helpers — app_metadata.role ONLY (case-insensitive)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.jwt_app_metadata_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(trim(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')));
$$;

COMMENT ON FUNCTION public.jwt_app_metadata_role IS
  'Lowercased JWT app_metadata.role for RLS; never reads user_metadata.';

CREATE OR REPLACE FUNCTION public.jwt_is_dispatcher_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_app_metadata_role() IN ('admin', 'dispatcher');
$$;

CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_app_metadata_role() = 'admin';
$$;

-- Operational role from synced profile (cleaner vs customer paths; not used for dispatcher/admin elevation)
CREATE OR REPLACE FUNCTION public.session_users_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
AS $$
  SELECT u.role FROM public.users u WHERE u.id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 3) Booking status edges — mirrors lib/bookings/lifecycle/transitions.ts
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.booking_status_edge_allowed(
  from_s public.booking_status,
  to_s public.booking_status
) RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT from_s IS NOT DISTINCT FROM to_s
    OR CASE from_s
      WHEN 'draft'::public.booking_status THEN
        to_s IN ('awaiting_payment'::public.booking_status, 'cancelled'::public.booking_status)
      WHEN 'awaiting_payment'::public.booking_status THEN
        to_s IN ('paid'::public.booking_status, 'cancelled'::public.booking_status)
      WHEN 'paid'::public.booking_status THEN
        to_s IN (
          'assigned'::public.booking_status,
          'cancelled'::public.booking_status,
          'refunded'::public.booking_status
        )
      WHEN 'assigned'::public.booking_status THEN
        to_s IN (
          'cleaner_en_route'::public.booking_status,
          'in_progress'::public.booking_status,
          'cancelled'::public.booking_status
        )
      WHEN 'cleaner_en_route'::public.booking_status THEN
        to_s IN ('in_progress'::public.booking_status, 'cancelled'::public.booking_status)
      WHEN 'in_progress'::public.booking_status THEN
        to_s IN ('completed'::public.booking_status, 'cancelled'::public.booking_status)
      WHEN 'completed'::public.booking_status THEN
        to_s IN ('refunded'::public.booking_status)
      WHEN 'cancelled'::public.booking_status THEN
        to_s IN ('refunded'::public.booking_status)
      WHEN 'refunded'::public.booking_status THEN FALSE
      ELSE FALSE
    END;
$$;

COMMENT ON FUNCTION public.booking_status_edge_allowed IS
  'RLS guard: allowed booking status edges; keep aligned with ALLOWED_BOOKING_TRANSITIONS in application code.';

-- ---------------------------------------------------------------------------
-- 4) Optional column guards (RLS cannot express all column rules cleanly)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bookings_guard_participant_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF public.jwt_is_dispatcher_or_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
    RAISE EXCEPTION 'bookings.customer_id is immutable for non-staff roles' USING ERRCODE = '42501';
  END IF;

  IF NEW.cleaner_id IS DISTINCT FROM OLD.cleaner_id THEN
    RAISE EXCEPTION 'bookings.cleaner_id may only be changed by dispatcher/admin' USING ERRCODE = '42501';
  END IF;

  IF NEW.internal_notes IS DISTINCT FROM OLD.internal_notes THEN
    RAISE EXCEPTION 'bookings.internal_notes is staff-only' USING ERRCODE = '42501';
  END IF;

  IF NEW.subtotal_cents IS DISTINCT FROM OLD.subtotal_cents
     OR NEW.fees_cents IS DISTINCT FROM OLD.fees_cents
     OR NEW.tax_cents IS DISTINCT FROM OLD.tax_cents
     OR NEW.total_cents IS DISTINCT FROM OLD.total_cents
     OR NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'bookings monetary fields are immutable for non-staff roles' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_guard_participant_columns ON public.bookings;

CREATE TRIGGER bookings_guard_participant_columns
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.bookings_guard_participant_columns();

COMMENT ON FUNCTION public.bookings_guard_participant_columns IS
  'Prevents customers/cleaners from mutating ownership, assignment, internal notes, or money columns; staff bypass via JWT.';

-- RLS UPDATE ... WITH CHECK cannot reference OLD (only NEW). Status edges use OLD+NEW → enforce here.
CREATE OR REPLACE FUNCTION public.bookings_enforce_lifecycle_edge()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  IF public.jwt_is_dispatcher_or_admin() THEN
    RETURN NEW;
  END IF;
  IF NOT public.booking_status_edge_allowed(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'invalid booking status transition (% → %)', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_enforce_lifecycle_edge ON public.bookings;

CREATE TRIGGER bookings_enforce_lifecycle_edge
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.bookings_enforce_lifecycle_edge();

COMMENT ON FUNCTION public.bookings_enforce_lifecycle_edge IS
  'Enforces booking_status_edge_allowed for non-staff updates (RLS WITH CHECK cannot use OLD).';

-- public.users.role must not change via PostgREST for authenticated sessions (sync uses other roles).
CREATE OR REPLACE FUNCTION public.users_block_role_mutation_for_authenticated()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND coalesce(auth.role()::text, '') = 'authenticated' THEN
    RAISE EXCEPTION 'public.users.role cannot be updated via the authenticated API' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_block_role_mutation_for_authenticated ON public.users;

CREATE TRIGGER users_block_role_mutation_for_authenticated
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.users_block_role_mutation_for_authenticated();

COMMENT ON FUNCTION public.users_block_role_mutation_for_authenticated IS
  'Blocks role column changes for JWT authenticated role; service_role / definer sync bypass.';

-- Payment row constraints that referenced OLD in RLS WITH CHECK (invalid) — enforce in trigger.
CREATE OR REPLACE FUNCTION public.payments_guard_row_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF public.jwt_is_dispatcher_or_admin() THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status
     AND NEW.booking_id IS NOT DISTINCT FROM OLD.booking_id
     AND NEW.amount_cents IS NOT DISTINCT FROM OLD.amount_cents
     AND trim(upper(NEW.currency::text)) IS NOT DISTINCT FROM trim(upper(OLD.currency::text)) THEN
    RETURN NEW;
  END IF;

  IF NEW.booking_id IS DISTINCT FROM OLD.booking_id
     OR NEW.amount_cents IS DISTINCT FROM OLD.amount_cents
     OR trim(upper(NEW.currency::text)) IS DISTINCT FROM trim(upper(OLD.currency::text)) THEN
    RAISE EXCEPTION 'payments booking_id / amount / currency are immutable for non-staff' USING ERRCODE = '42501';
  END IF;

  IF OLD.status IN (
    'pending'::public.payment_status,
    'processing'::public.payment_status,
    'requires_action'::public.payment_status
  ) THEN
    IF NEW.status NOT IN (
      'pending'::public.payment_status,
      'processing'::public.payment_status,
      'requires_action'::public.payment_status,
      'succeeded'::public.payment_status,
      'failed'::public.payment_status,
      'canceled'::public.payment_status
    ) THEN
      RAISE EXCEPTION 'invalid payment status target for non-staff row update' USING ERRCODE = '23514';
    END IF;
  ELSE
    RAISE EXCEPTION 'payments row is not updatable from this lifecycle state for non-staff' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_guard_row_updates ON public.payments;

CREATE TRIGGER payments_guard_row_updates
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.payments_guard_row_updates();

COMMENT ON FUNCTION public.payments_guard_row_updates IS
  'Non-staff payment updates: immutable financial keys; status transitions only from open attempt states.';

-- ---------------------------------------------------------------------------
-- 5) Grants — authenticated app; deny anon on sensitive tables
-- ---------------------------------------------------------------------------

REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.bookings FROM anon;
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.booking_events FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT ON public.booking_events TO authenticated;

GRANT EXECUTE ON FUNCTION public.jwt_app_metadata_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jwt_is_dispatcher_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jwt_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.session_users_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.booking_status_edge_allowed(public.booking_status, public.booking_status)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 6) ENABLE RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Note: FORCE ROW LEVEL SECURITY is intentionally not used — it would apply policies to
-- table-owner contexts and can break SECURITY DEFINER auth sync / maintenance jobs unless
-- every path has explicit policies or BYPASSRLS roles.

-- ---------------------------------------------------------------------------
-- 7) public.users
-- ---------------------------------------------------------------------------

CREATE POLICY users_select_self_or_staff
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

CREATE POLICY users_insert_none_authenticated
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Self-service OR dispatcher/admin profile edits; role is never mutable via PostgREST (sync / service_role only).
CREATE POLICY users_update_authenticated
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR public.jwt_is_dispatcher_or_admin()
  )
  WITH CHECK (id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

-- ---------------------------------------------------------------------------
-- 8) public.bookings
-- ---------------------------------------------------------------------------

CREATE POLICY bookings_select_participants_or_staff
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR cleaner_id = auth.uid()
    OR public.jwt_is_dispatcher_or_admin()
  );

CREATE POLICY bookings_insert_customer_draft
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND status = 'draft'::public.booking_status
    AND cleaner_id IS NULL
  );

CREATE POLICY bookings_insert_staff
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

CREATE POLICY bookings_update_staff
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (public.jwt_is_dispatcher_or_admin())
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

CREATE POLICY bookings_update_participant
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    NOT public.jwt_is_dispatcher_or_admin()
    AND (customer_id = auth.uid() OR cleaner_id = auth.uid())
  )
  WITH CHECK (
    NOT public.jwt_is_dispatcher_or_admin()
    AND (
      (
        customer_id = auth.uid()
        AND public.session_users_role() = 'customer'::public.user_role
      )
      OR (
        cleaner_id = auth.uid()
        AND public.session_users_role() = 'cleaner'::public.user_role
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 9) public.booking_events — read-only for clients; writes from SECURITY DEFINER trigger only
-- ---------------------------------------------------------------------------

CREATE POLICY booking_events_select_via_booking_access
  ON public.booking_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_events.booking_id
        AND (
          b.customer_id = auth.uid()
          OR b.cleaner_id = auth.uid()
          OR public.jwt_is_dispatcher_or_admin()
        )
    )
  );

-- No INSERT / UPDATE / DELETE policies for authenticated → default deny

-- ---------------------------------------------------------------------------
-- 10) public.payments
-- ---------------------------------------------------------------------------

CREATE POLICY payments_select_via_booking_access
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND (
          b.customer_id = auth.uid()
          OR b.cleaner_id = auth.uid()
          OR public.jwt_is_dispatcher_or_admin()
        )
    )
  );

CREATE POLICY payments_insert_customer_awaiting
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.jwt_is_dispatcher_or_admin()
    OR (
      EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id = payments.booking_id
          AND b.customer_id = auth.uid()
          AND b.status = 'awaiting_payment'::public.booking_status
      )
      AND amount_cents = (
        SELECT b2.total_cents FROM public.bookings b2 WHERE b2.id = payments.booking_id
      )
      AND upper(currency) = (
        SELECT upper(b3.currency::text) FROM public.bookings b3 WHERE b3.id = payments.booking_id
      )
    )
  );

CREATE POLICY payments_update_via_booking_access
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND (
          b.customer_id = auth.uid()
          OR public.jwt_is_dispatcher_or_admin()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND (
          b.customer_id = auth.uid()
          OR public.jwt_is_dispatcher_or_admin()
        )
    )
  );

-- Cleaners: read payments for assigned jobs (SELECT policy) but no UPDATE (payment orchestration is customer/staff)

COMMENT ON POLICY payments_insert_customer_awaiting ON public.payments IS
  'Customer may insert Paystack rows only while booking is awaiting_payment and amounts match booking totals.';
