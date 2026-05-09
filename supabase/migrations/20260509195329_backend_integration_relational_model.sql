-- Backend Integration Roadmap Phase 2 — relational model expansion.
-- This migration adds the missing tables without replacing the existing
-- bookings.status + booking_events lifecycle contract.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

DO $migrate$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'cleaner_assignment_status') THEN
    CREATE TYPE public.cleaner_assignment_status AS ENUM ('offered', 'accepted', 'declined', 'cancelled', 'completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'assignment_event_type') THEN
    CREATE TYPE public.assignment_event_type AS ENUM (
      'assignment_created',
      'assignment_sent',
      'assignment_accepted',
      'assignment_declined',
      'cleaner_departed',
      'cleaner_arrived',
      'assignment_reassigned',
      'assignment_cancelled',
      'assignment_completed',
      'assignment_conflict_detected'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'conversation_thread_kind') THEN
    CREATE TYPE public.conversation_thread_kind AS ENUM ('booking', 'support', 'operations', 'assignment', 'operational_note');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'notification_kind') THEN
    CREATE TYPE public.notification_kind AS ENUM (
      'booking_lifecycle',
      'cleaner_assignment',
      'payment',
      'support',
      'system',
      'booking_notification',
      'assignment_notification',
      'message_notification',
      'dispatch_alert',
      'escalation_alert',
      'payment_notification',
      'operational_warning'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'notification_priority') THEN
    CREATE TYPE public.notification_priority AS ENUM ('low', 'normal', 'high', 'critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'notification_state') THEN
    CREATE TYPE public.notification_state AS ENUM ('unread', 'read', 'archived', 'dismissed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'invoice_status') THEN
    CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'cancelled', 'void', 'refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'payout_status') THEN
    CREATE TYPE public.payout_status AS ENUM ('pending', 'queued', 'processing', 'paid', 'paid_out', 'failed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'refund_status') THEN
    CREATE TYPE public.refund_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'operational_audit_action') THEN
    CREATE TYPE public.operational_audit_action AS ENUM (
      'booking_mutation',
      'assignment_transition',
      'payment_mutation',
      'refund_mutation',
      'payout_mutation',
      'message_mutation',
      'notification_mutation',
      'permission_sensitive_action',
      'escalation_event',
      'reconciliation_event'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'attachment_owner_kind') THEN
    CREATE TYPE public.attachment_owner_kind AS ENUM ('booking', 'booking_event', 'message', 'invoice', 'profile');
  END IF;
END
$migrate$;

DO $migrate$
DECLARE
  v_label text;
BEGIN
  FOREACH v_label IN ARRAY ARRAY['authorized', 'paid', 'disputed'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'payment_status'
        AND e.enumlabel = v_label
    ) THEN
      EXECUTE format('ALTER TYPE public.payment_status ADD VALUE %L', v_label);
    END IF;
  END LOOP;

  FOREACH v_label IN ARRAY ARRAY['overdue', 'cancelled'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'invoice_status'
        AND e.enumlabel = v_label
    ) THEN
      EXECUTE format('ALTER TYPE public.invoice_status ADD VALUE %L', v_label);
    END IF;
  END LOOP;

  FOREACH v_label IN ARRAY ARRAY['queued', 'paid_out'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'payout_status'
        AND e.enumlabel = v_label
    ) THEN
      EXECUTE format('ALTER TYPE public.payout_status ADD VALUE %L', v_label);
    END IF;
  END LOOP;
END
$migrate$;

DO $migrate$
DECLARE
  v_label text;
BEGIN
  FOREACH v_label IN ARRAY ARRAY[
    'booking_notification',
    'assignment_notification',
    'message_notification',
    'dispatch_alert',
    'escalation_alert',
    'payment_notification',
    'operational_warning'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'notification_kind'
        AND e.enumlabel = v_label
    ) THEN
      EXECUTE format('ALTER TYPE public.notification_kind ADD VALUE %L', v_label);
    END IF;
  END LOOP;
END
$migrate$;

DO $migrate$
DECLARE
  v_label text;
BEGIN
  FOREACH v_label IN ARRAY ARRAY['assignment', 'operational_note'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'conversation_thread_kind'
        AND e.enumlabel = v_label
    ) THEN
      EXECUTE format('ALTER TYPE public.conversation_thread_kind ADD VALUE %L', v_label);
    END IF;
  END LOOP;
END
$migrate$;

DO $migrate$
DECLARE
  v_label text;
BEGIN
  FOREACH v_label IN ARRAY ARRAY[
    'pending_assignment',
    'assignment_proposed',
    'assignment_accepted',
    'assignment_declined',
    'cleaner_en_route',
    'cleaner_arrived',
    'in_service',
    'reassignment_required'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'cleaner_assignment_status'
        AND e.enumlabel = v_label
    ) THEN
      EXECUTE format('ALTER TYPE public.cleaner_assignment_status ADD VALUE %L', v_label);
    END IF;
  END LOOP;
END
$migrate$;

DO $migrate$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'booking_event_type'
      AND e.enumlabel = 'BOOKING_CONFIRMED'
  ) THEN
    ALTER TYPE public.booking_event_type ADD VALUE 'BOOKING_CONFIRMED' AFTER 'BOOKING_CREATED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'booking_event_type'
      AND e.enumlabel = 'BOOKING_RESCHEDULED'
  ) THEN
    ALTER TYPE public.booking_event_type ADD VALUE 'BOOKING_RESCHEDULED' AFTER 'BOOKING_CANCELLED';
  END IF;
END
$migrate$;

-- ---------------------------------------------------------------------------
-- Role-specific profile projections
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  legal_name text,
  preferred_name text,
  timezone text NOT NULL DEFAULT 'Africa/Johannesburg',
  locale text NOT NULL DEFAULT 'en-ZA',
  onboarding_status text NOT NULL DEFAULT 'pending'
    CONSTRAINT profiles_onboarding_status_chk CHECK (onboarding_status IN ('pending', 'active', 'paused', 'archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.customers (
  user_id uuid PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  default_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  booking_notes text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER customers_set_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cleaners (
  user_id uuid PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  service_areas text[] NOT NULL DEFAULT '{}'::text[],
  skills text[] NOT NULL DEFAULT '{}'::text[],
  verification_status text NOT NULL DEFAULT 'pending'
    CONSTRAINT cleaners_verification_status_chk CHECK (verification_status IN ('pending', 'verified', 'suspended')),
  availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  payout_account_last4 text,
  rating numeric(3,2) CONSTRAINT cleaners_rating_chk CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER cleaners_set_updated_at
BEFORE UPDATE ON public.cleaners
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.admins (
  user_id uuid PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  permissions text[] NOT NULL DEFAULT '{}'::text[],
  invited_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  activated_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER admins_set_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.profiles IS 'Shared user profile details; auth identity remains auth.users and operational role remains public.users.role.';
COMMENT ON TABLE public.customers IS 'Customer-specific profile projection. Does not duplicate auth identity or booking lifecycle state.';
COMMENT ON TABLE public.cleaners IS 'Cleaner-specific profile projection for dispatch and workforce views.';
COMMENT ON TABLE public.admins IS 'Admin/dispatcher operational profile projection.';

-- ---------------------------------------------------------------------------
-- Booking preferences, recurrence, and assignments
-- ---------------------------------------------------------------------------

CREATE TABLE public.recurring_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active'
    CONSTRAINT recurring_plans_status_chk CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  cadence text NOT NULL
    CONSTRAINT recurring_plans_cadence_chk CHECK (cadence IN ('weekly', 'biweekly', 'monthly')),
  service_timezone text NOT NULL DEFAULT 'Africa/Johannesburg',
  starts_on date NOT NULL,
  ends_on date,
  last_booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  next_booking_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recurring_plans_dates_chk CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TRIGGER recurring_plans_set_updated_at
BEFORE UPDATE ON public.recurring_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.booking_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings (id) ON DELETE CASCADE,
  recurring_plan_id uuid REFERENCES public.recurring_plans (id) ON DELETE SET NULL,
  preference_mode text NOT NULL DEFAULT 'best_available'
    CONSTRAINT booking_preferences_mode_chk CHECK (preference_mode IN ('best_available', 'same_cleaner', 'preferred_cleaner')),
  preferred_cleaner_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  cadence text NOT NULL DEFAULT 'once'
    CONSTRAINT booking_preferences_cadence_chk CHECK (cadence IN ('once', 'weekly', 'biweekly', 'monthly')),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER booking_preferences_set_updated_at
BEFORE UPDATE ON public.booking_preferences
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cleaner_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  cleaner_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  assigned_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  status public.cleaner_assignment_status NOT NULL DEFAULT 'offered',
  offered_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cleaner_assignments_response_chk CHECK (
    responded_at IS NULL
    OR status::text IN (
      'accepted',
      'declined',
      'cancelled',
      'completed',
      'assignment_accepted',
      'assignment_declined',
      'cleaner_en_route',
      'cleaner_arrived',
      'in_service',
      'reassignment_required'
    )
  )
);

CREATE TRIGGER cleaner_assignments_set_updated_at
BEFORE UPDATE ON public.cleaner_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX cleaner_assignments_active_uidx
  ON public.cleaner_assignments (booking_id, cleaner_id)
  WHERE status::text IN ('offered', 'accepted', 'assignment_proposed', 'assignment_accepted');

CREATE INDEX recurring_plans_customer_status_idx
  ON public.recurring_plans (customer_id, status, next_booking_at);
CREATE INDEX booking_preferences_preferred_cleaner_idx
  ON public.booking_preferences (preferred_cleaner_id)
  WHERE preferred_cleaner_id IS NOT NULL;
CREATE INDEX cleaner_assignments_booking_created_idx
  ON public.cleaner_assignments (booking_id, created_at DESC);
CREATE INDEX cleaner_assignments_cleaner_status_idx
  ON public.cleaner_assignments (cleaner_id, status, created_at DESC);

CREATE TABLE public.assignment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.cleaner_assignments (id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  cleaner_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  event_type public.assignment_event_type NOT NULL,
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.assignment_events_prevent_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'assignment_events are append-only (assignment_id=%)', OLD.assignment_id
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER assignment_events_no_update
BEFORE UPDATE ON public.assignment_events
FOR EACH ROW
EXECUTE FUNCTION public.assignment_events_prevent_update();

CREATE INDEX assignment_events_assignment_created_idx
  ON public.assignment_events (assignment_id, created_at DESC);
CREATE INDEX assignment_events_booking_created_idx
  ON public.assignment_events (booking_id, created_at DESC);
CREATE INDEX assignment_events_cleaner_created_idx
  ON public.assignment_events (cleaner_id, created_at DESC);

CREATE TABLE public.cleaner_operational_states (
  cleaner_id uuid PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  availability_status text NOT NULL DEFAULT 'offline'
    CONSTRAINT cleaner_operational_states_status_chk CHECK (availability_status IN ('offline', 'online', 'busy', 'paused')),
  active_shift boolean NOT NULL DEFAULT false,
  ready_for_assignment boolean NOT NULL DEFAULT false,
  current_assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER cleaner_operational_states_set_updated_at
BEFORE UPDATE ON public.cleaner_operational_states
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cleaner_availability_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'available'
    CONSTRAINT cleaner_availability_windows_status_chk CHECK (status IN ('available', 'unavailable', 'blocked')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cleaner_availability_windows_time_chk CHECK (ends_at > starts_at)
);

CREATE TRIGGER cleaner_availability_windows_set_updated_at
BEFORE UPDATE ON public.cleaner_availability_windows
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX cleaner_availability_windows_cleaner_time_idx
  ON public.cleaner_availability_windows (cleaner_id, starts_at, ends_at);

COMMENT ON TABLE public.booking_preferences IS 'Customer booking preferences and cadence; lifecycle state remains public.bookings.status.';
COMMENT ON TABLE public.recurring_plans IS 'Recurring booking plan template. Individual bookings remain operational source of truth.';
COMMENT ON TABLE public.cleaner_assignments IS 'Assignment history and cleaner response state; booking lifecycle remains centralized in bookings.status + booking_events.';
COMMENT ON TABLE public.assignment_events IS 'Append-only assignment lifecycle and dispatch history; integrated with booking timelines by booking_id.';
COMMENT ON TABLE public.cleaner_operational_states IS 'Current cleaner operational readiness. Presence/heartbeat can extend this later.';
COMMENT ON TABLE public.cleaner_availability_windows IS 'Cleaner availability/blocked windows for dispatch conflict detection.';

-- ---------------------------------------------------------------------------
-- Messaging, notifications, billing, payouts, and attachments
-- ---------------------------------------------------------------------------

CREATE TABLE public.conversation_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings (id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  kind public.conversation_thread_kind NOT NULL DEFAULT 'booking',
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  closed_at timestamptz,
  archived_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversation_threads_booking_kind_chk CHECK (
    kind::text <> 'booking' OR booking_id IS NOT NULL
  ),
  CONSTRAINT conversation_threads_assignment_kind_chk CHECK (
    kind::text <> 'assignment' OR assignment_id IS NOT NULL
  )
);

CREATE TRIGGER conversation_threads_set_updated_at
BEFORE UPDATE ON public.conversation_threads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.conversation_threads (id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  sender_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  sender_role public.user_role NOT NULL,
  body text NOT NULL CONSTRAINT messages_body_chk CHECK (char_length(btrim(body)) > 0),
  read_at timestamptz,
  internal_only boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER messages_set_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.conversation_read_states (
  thread_id uuid NOT NULL REFERENCES public.conversation_threads (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  last_read_at timestamptz,
  archived_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE TRIGGER conversation_read_states_set_updated_at
BEFORE UPDATE ON public.conversation_read_states
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  thread_id uuid REFERENCES public.conversation_threads (id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.messages (id) ON DELETE SET NULL,
  booking_event_id uuid REFERENCES public.booking_events (id) ON DELETE SET NULL,
  kind public.notification_kind NOT NULL,
  priority public.notification_priority NOT NULL DEFAULT 'normal',
  state public.notification_state NOT NULL DEFAULT 'unread',
  title text NOT NULL,
  body text,
  read_at timestamptz,
  dismissed_at timestamptz,
  archived_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER notifications_set_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE RESTRICT,
  payment_id uuid REFERENCES public.payments (id) ON DELETE SET NULL,
  invoice_number text UNIQUE,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'ZAR',
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER invoices_set_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE RESTRICT,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount_cents bigint NOT NULL CHECK (unit_amount_cents >= 0),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER invoice_line_items_set_updated_at
BEFORE UPDATE ON public.invoice_line_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE RESTRICT,
  status public.refund_status NOT NULL DEFAULT 'pending',
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency char(3) NOT NULL DEFAULT 'ZAR',
  provider_reference text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER refunds_set_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'ZAR',
  provider_reference text,
  scheduled_at timestamptz,
  paid_at timestamptz,
  failure_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER payouts_set_updated_at
BEFORE UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cleaner_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE RESTRICT,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  payout_id uuid REFERENCES public.payouts (id) ON DELETE SET NULL,
  gross_cents bigint NOT NULL CHECK (gross_cents >= 0),
  platform_fee_cents bigint NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  net_cents bigint NOT NULL CHECK (net_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'ZAR',
  earned_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cleaner_earnings_net_chk CHECK (net_cents = gross_cents - platform_fee_cents)
);

CREATE TRIGGER cleaner_earnings_set_updated_at
BEFORE UPDATE ON public.cleaner_earnings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reliability, idempotency, and immutable operational audit
-- ---------------------------------------------------------------------------

CREATE TABLE public.idempotency_keys (
  key text NOT NULL,
  scope text NOT NULL,
  request_hash text,
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'started'
    CONSTRAINT idempotency_keys_status_chk CHECK (status IN ('started', 'completed', 'failed')),
  expires_at timestamptz,
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key)
);

CREATE TRIGGER idempotency_keys_set_updated_at
BEFORE UPDATE ON public.idempotency_keys
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.operational_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action public.operational_audit_action NOT NULL,
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  subject_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments (id) ON DELETE SET NULL,
  entity_kind text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.operational_audit_events_prevent_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'operational_audit_events are append-only (id=%)', OLD.id
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER operational_audit_events_no_update
BEFORE UPDATE ON public.operational_audit_events
FOR EACH ROW
EXECUTE FUNCTION public.operational_audit_events_prevent_update();

CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_kind public.attachment_owner_kind NOT NULL,
  owner_id uuid NOT NULL,
  uploaded_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE CASCADE,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  content_type text,
  byte_size bigint CHECK (byte_size IS NULL OR byte_size >= 0),
  visibility text NOT NULL DEFAULT 'participants'
    CONSTRAINT attachments_visibility_chk CHECK (visibility IN ('private', 'participants', 'staff')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attachments_storage_uidx UNIQUE (storage_bucket, storage_path)
);

CREATE TRIGGER attachments_set_updated_at
BEFORE UPDATE ON public.attachments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX conversation_threads_booking_idx
  ON public.conversation_threads (booking_id, updated_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX conversation_threads_assignment_idx
  ON public.conversation_threads (assignment_id, updated_at DESC)
  WHERE assignment_id IS NOT NULL;
CREATE INDEX messages_thread_created_idx
  ON public.messages (thread_id, created_at ASC);
CREATE INDEX messages_booking_created_idx
  ON public.messages (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX messages_assignment_created_idx
  ON public.messages (assignment_id, created_at DESC)
  WHERE assignment_id IS NOT NULL;
CREATE INDEX conversation_read_states_user_archived_idx
  ON public.conversation_read_states (user_id, archived_at, updated_at DESC);
CREATE INDEX notifications_user_read_created_idx
  ON public.notifications (user_id, read_at, created_at DESC);
CREATE INDEX notifications_user_state_priority_idx
  ON public.notifications (user_id, state, priority, created_at DESC);
CREATE INDEX notifications_booking_idx
  ON public.notifications (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX notifications_assignment_idx
  ON public.notifications (assignment_id, created_at DESC)
  WHERE assignment_id IS NOT NULL;
CREATE INDEX notifications_thread_idx
  ON public.notifications (thread_id, created_at DESC)
  WHERE thread_id IS NOT NULL;
CREATE INDEX invoices_booking_idx
  ON public.invoices (booking_id, created_at DESC);
CREATE INDEX invoice_line_items_invoice_idx
  ON public.invoice_line_items (invoice_id, created_at ASC);
CREATE INDEX refunds_payment_idx
  ON public.refunds (payment_id, created_at DESC);
CREATE INDEX refunds_booking_idx
  ON public.refunds (booking_id, created_at DESC);
CREATE INDEX payouts_cleaner_status_idx
  ON public.payouts (cleaner_id, status, created_at DESC);
CREATE INDEX cleaner_earnings_cleaner_created_idx
  ON public.cleaner_earnings (cleaner_id, created_at DESC);
CREATE INDEX cleaner_earnings_payout_idx
  ON public.cleaner_earnings (payout_id)
  WHERE payout_id IS NOT NULL;
CREATE INDEX idempotency_keys_expires_idx
  ON public.idempotency_keys (expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX operational_audit_events_created_idx
  ON public.operational_audit_events (created_at DESC);
CREATE INDEX operational_audit_events_booking_idx
  ON public.operational_audit_events (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX operational_audit_events_entity_idx
  ON public.operational_audit_events (entity_kind, entity_id, created_at DESC);
CREATE INDEX attachments_booking_idx
  ON public.attachments (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;

COMMENT ON TABLE public.messages IS 'Persisted messages linked to conversation_threads; realtime may subscribe without touching lifecycle state.';
COMMENT ON TABLE public.conversation_read_states IS 'Per-user thread read/archive state for unread badge reconciliation.';
COMMENT ON TABLE public.notifications IS 'Role-owned in-app notifications and operational alerts. Email/SMS side effects remain in notification_outbox.';
COMMENT ON TABLE public.invoices IS 'Invoice records linked to payments and bookings; payment lifecycle remains separate from booking lifecycle.';
COMMENT ON TABLE public.invoice_line_items IS 'Immutable invoice pricing snapshots; historical invoices are not recalculated from mutable booking pricing.';
COMMENT ON TABLE public.refunds IS 'Refund records linked to payments/bookings for cancellation and support reconciliation.';
COMMENT ON TABLE public.payouts IS 'Cleaner payout tracking, intentionally decoupled from booking status.';
COMMENT ON TABLE public.cleaner_earnings IS 'Assignment-linked cleaner earnings and payout liability records.';
COMMENT ON TABLE public.idempotency_keys IS 'Centralized mutation idempotency records for retry-safe operational writes.';
COMMENT ON TABLE public.operational_audit_events IS 'Immutable operational audit records for lifecycle, dispatch, financial, and permission-sensitive actions.';
COMMENT ON TABLE public.attachments IS 'Storage object metadata; binary files live in Supabase Storage with signed URL access.';

-- ---------------------------------------------------------------------------
-- RLS defaults and participant/staff access
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_operational_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_availability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_read_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_participant_or_staff
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY profiles_insert_self
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY profiles_update_self
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

CREATE POLICY customers_select_self_or_staff
  ON public.customers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY customers_insert_self_or_staff
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY customers_update_self_or_staff
  ON public.customers FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

CREATE POLICY cleaners_select_self_or_staff
  ON public.cleaners FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY cleaners_insert_self_or_staff
  ON public.cleaners FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY cleaners_update_self_or_staff
  ON public.cleaners FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

CREATE POLICY admins_admin_only
  ON public.admins FOR ALL TO authenticated
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

CREATE POLICY recurring_plans_customer_or_staff
  ON public.recurring_plans FOR ALL TO authenticated
  USING (customer_id = auth.uid() OR public.jwt_is_dispatcher_or_admin())
  WITH CHECK (customer_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

CREATE POLICY booking_preferences_participant_or_staff
  ON public.booking_preferences FOR ALL TO authenticated
  USING (
    public.jwt_is_dispatcher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_preferences.booking_id
        AND (b.customer_id = auth.uid() OR b.cleaner_id = auth.uid())
    )
  )
  WITH CHECK (
    public.jwt_is_dispatcher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_preferences.booking_id
        AND b.customer_id = auth.uid()
    )
  );

CREATE POLICY cleaner_assignments_select_participant_or_staff
  ON public.cleaner_assignments FOR SELECT TO authenticated
  USING (
    cleaner_id = auth.uid()
    OR public.jwt_is_dispatcher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = cleaner_assignments.booking_id
        AND b.customer_id = auth.uid()
    )
  );
CREATE POLICY cleaner_assignments_staff_insert_update
  ON public.cleaner_assignments FOR ALL TO authenticated
  USING (public.jwt_is_dispatcher_or_admin())
  WITH CHECK (public.jwt_is_dispatcher_or_admin());
CREATE POLICY cleaner_assignments_cleaner_update_response
  ON public.cleaner_assignments FOR UPDATE TO authenticated
  USING (cleaner_id = auth.uid())
  WITH CHECK (cleaner_id = auth.uid());

CREATE POLICY assignment_events_select_participant_or_staff
  ON public.assignment_events FOR SELECT TO authenticated
  USING (
    cleaner_id = auth.uid()
    OR public.jwt_is_dispatcher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = assignment_events.booking_id
        AND b.customer_id = auth.uid()
    )
  );
CREATE POLICY assignment_events_insert_staff_or_owner
  ON public.assignment_events FOR INSERT TO authenticated
  WITH CHECK (
    public.jwt_is_dispatcher_or_admin()
    OR cleaner_id = auth.uid()
  );

CREATE POLICY cleaner_operational_states_select_self_or_staff
  ON public.cleaner_operational_states FOR SELECT TO authenticated
  USING (cleaner_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY cleaner_operational_states_upsert_self_or_staff
  ON public.cleaner_operational_states FOR ALL TO authenticated
  USING (cleaner_id = auth.uid() OR public.jwt_is_dispatcher_or_admin())
  WITH CHECK (cleaner_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

CREATE POLICY cleaner_availability_windows_select_self_or_staff
  ON public.cleaner_availability_windows FOR SELECT TO authenticated
  USING (cleaner_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY cleaner_availability_windows_write_self_or_staff
  ON public.cleaner_availability_windows FOR ALL TO authenticated
  USING (cleaner_id = auth.uid() OR public.jwt_is_dispatcher_or_admin())
  WITH CHECK (cleaner_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

CREATE POLICY conversation_threads_participant_or_staff
  ON public.conversation_threads FOR ALL TO authenticated
  USING (
    public.jwt_is_dispatcher_or_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = conversation_threads.booking_id
        AND (b.customer_id = auth.uid() OR b.cleaner_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.cleaner_assignments a
      WHERE a.id = conversation_threads.assignment_id
        AND a.cleaner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.jwt_is_dispatcher_or_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = conversation_threads.booking_id
        AND (b.customer_id = auth.uid() OR b.cleaner_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.cleaner_assignments a
      WHERE a.id = conversation_threads.assignment_id
        AND a.cleaner_id = auth.uid()
    )
  );

CREATE POLICY messages_participant_or_staff
  ON public.messages FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR public.jwt_is_dispatcher_or_admin()
    OR (
      messages.internal_only = false
      AND EXISTS (
      SELECT 1 FROM public.conversation_threads t
      LEFT JOIN public.bookings b ON b.id = t.booking_id
      LEFT JOIN public.cleaner_assignments a ON a.id = t.assignment_id
      WHERE t.id = messages.thread_id
        AND (t.created_by = auth.uid() OR b.customer_id = auth.uid() OR b.cleaner_id = auth.uid() OR a.cleaner_id = auth.uid())
      )
    )
  );
CREATE POLICY messages_insert_sender_participant_or_staff
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.jwt_is_dispatcher_or_admin()
      OR EXISTS (
        SELECT 1 FROM public.conversation_threads t
        LEFT JOIN public.bookings b ON b.id = t.booking_id
        LEFT JOIN public.cleaner_assignments a ON a.id = t.assignment_id
        WHERE t.id = messages.thread_id
          AND (
            (messages.internal_only = false AND (t.created_by = auth.uid() OR b.customer_id = auth.uid() OR b.cleaner_id = auth.uid() OR a.cleaner_id = auth.uid()))
            OR (messages.internal_only = true AND public.jwt_is_dispatcher_or_admin())
          )
      )
    )
  );

CREATE POLICY conversation_read_states_self_or_staff
  ON public.conversation_read_states FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

CREATE POLICY notifications_self_or_staff
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY notifications_update_read_state
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin())
  WITH CHECK (
    user_id = auth.uid()
    OR public.jwt_is_dispatcher_or_admin()
  );
CREATE POLICY notifications_staff_insert
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    public.jwt_is_dispatcher_or_admin()
    OR user_id = auth.uid()
  );

CREATE POLICY invoices_customer_or_staff
  ON public.invoices FOR SELECT TO authenticated
  USING (
    public.jwt_is_dispatcher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = invoices.booking_id
        AND b.customer_id = auth.uid()
    )
  );
CREATE POLICY invoices_staff_write
  ON public.invoices FOR ALL TO authenticated
  USING (public.jwt_is_dispatcher_or_admin())
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

CREATE POLICY invoice_line_items_customer_or_staff
  ON public.invoice_line_items FOR SELECT TO authenticated
  USING (
    public.jwt_is_dispatcher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = invoice_line_items.booking_id
        AND b.customer_id = auth.uid()
    )
  );
CREATE POLICY invoice_line_items_staff_write
  ON public.invoice_line_items FOR ALL TO authenticated
  USING (public.jwt_is_dispatcher_or_admin())
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

CREATE POLICY refunds_customer_or_staff
  ON public.refunds FOR SELECT TO authenticated
  USING (
    public.jwt_is_dispatcher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = refunds.booking_id
        AND b.customer_id = auth.uid()
    )
  );
CREATE POLICY refunds_staff_write
  ON public.refunds FOR ALL TO authenticated
  USING (public.jwt_is_dispatcher_or_admin())
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

CREATE POLICY payouts_cleaner_or_staff
  ON public.payouts FOR SELECT TO authenticated
  USING (cleaner_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY payouts_staff_write
  ON public.payouts FOR ALL TO authenticated
  USING (public.jwt_is_dispatcher_or_admin())
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

CREATE POLICY cleaner_earnings_cleaner_or_staff
  ON public.cleaner_earnings FOR SELECT TO authenticated
  USING (cleaner_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());
CREATE POLICY cleaner_earnings_staff_write
  ON public.cleaner_earnings FOR ALL TO authenticated
  USING (public.jwt_is_dispatcher_or_admin())
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

CREATE POLICY idempotency_keys_actor_or_staff
  ON public.idempotency_keys FOR ALL TO authenticated
  USING (actor_user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin())
  WITH CHECK (actor_user_id = auth.uid() OR public.jwt_is_dispatcher_or_admin());

CREATE POLICY operational_audit_events_select_staff
  ON public.operational_audit_events FOR SELECT TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());
CREATE POLICY operational_audit_events_insert_staff
  ON public.operational_audit_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

CREATE POLICY attachments_participant_or_staff
  ON public.attachments FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.jwt_is_dispatcher_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = attachments.booking_id
        AND (b.customer_id = auth.uid() OR b.cleaner_id = auth.uid())
    )
  );
CREATE POLICY attachments_insert_uploader
  ON public.attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() OR public.jwt_is_dispatcher_or_admin());

GRANT INSERT ON TABLE public.booking_events TO authenticated;

CREATE POLICY booking_events_insert_participant_operational
  ON public.booking_events FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND event_type IN (
      'BOOKING_CONFIRMED'::public.booking_event_type,
      'BOOKING_RESCHEDULED'::public.booking_event_type
    )
    AND (
      public.jwt_is_dispatcher_or_admin()
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_events.booking_id
          AND (b.customer_id = auth.uid() OR b.cleaner_id = auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime candidates. These tables map cleanly into the shared workflow event
-- system later without adding role-specific lifecycle engines.
-- ---------------------------------------------------------------------------

DO $realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaner_assignments;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assignment_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaner_operational_states;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_threads;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_read_states;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.refunds;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$realtime$;

-- ---------------------------------------------------------------------------
-- Stage 14: operational automation and workflow intelligence
-- Automation is advisory only: recommendations are auditable signals, not
-- direct lifecycle mutations.
-- ---------------------------------------------------------------------------

DO $automation_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'automation_decision';
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'automation_override';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_event_kind') THEN
    CREATE TYPE public.automation_event_kind AS ENUM (
      'signal_detected',
      'dispatch_recommendation',
      'sla_escalation',
      'notification_automation',
      'queue_priority',
      'workforce_insight',
      'human_override'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_signal_kind') THEN
    CREATE TYPE public.automation_signal_kind AS ENUM (
      'cleaner_lateness_risk',
      'schedule_conflict_risk',
      'overload_detection',
      'payout_anomaly',
      'booking_inactivity',
      'customer_escalation_risk',
      'reassignment_likelihood',
      'recurring_cadence_anomaly',
      'workforce_utilization'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispatch_recommendation_kind') THEN
    CREATE TYPE public.dispatch_recommendation_kind AS ENUM (
      'recommended_cleaner',
      'workload_balanced_assignment',
      'proximity_aware_recommendation',
      'reassignment_recommendation',
      'fallback_cleaner'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_severity') THEN
    CREATE TYPE public.automation_severity AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'automation_event_status') THEN
    CREATE TYPE public.automation_event_status AS ENUM (
      'open',
      'acknowledged',
      'accepted',
      'dismissed',
      'overridden',
      'resolved'
    );
  END IF;
END
$automation_enums$;

CREATE TABLE IF NOT EXISTS public.automation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_kind public.automation_event_kind NOT NULL,
  signal_kind public.automation_signal_kind,
  recommendation_kind public.dispatch_recommendation_kind,
  severity public.automation_severity NOT NULL DEFAULT 'low',
  score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 1),
  status public.automation_event_status NOT NULL DEFAULT 'open',
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  cleaner_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments (id) ON DELETE SET NULL,
  entity_kind text NOT NULL,
  entity_id uuid,
  title text NOT NULL,
  summary text NOT NULL,
  reasoning text[] NOT NULL DEFAULT ARRAY[]::text[],
  recommended_action text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  overridden_at timestamptz,
  override_reason text
);

CREATE INDEX IF NOT EXISTS automation_events_created_idx
  ON public.automation_events (created_at DESC);
CREATE INDEX IF NOT EXISTS automation_events_booking_idx
  ON public.automation_events (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS automation_events_assignment_idx
  ON public.automation_events (assignment_id, created_at DESC)
  WHERE assignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS automation_events_target_user_idx
  ON public.automation_events (target_user_id, created_at DESC)
  WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS automation_events_status_idx
  ON public.automation_events (status, severity, created_at DESC);

COMMENT ON TABLE public.automation_events IS
  'Advisory automation signals and recommendations. Automation never mutates lifecycle state directly.';

ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_events_select_staff_or_target ON public.automation_events;
CREATE POLICY automation_events_select_staff_or_target
  ON public.automation_events FOR SELECT TO authenticated
  USING (
    public.jwt_is_dispatcher_or_admin()
    OR target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = automation_events.booking_id
        AND (b.customer_id = auth.uid() OR b.cleaner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS automation_events_insert_staff ON public.automation_events;
CREATE POLICY automation_events_insert_staff
  ON public.automation_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DROP POLICY IF EXISTS automation_events_update_staff ON public.automation_events;
CREATE POLICY automation_events_update_staff
  ON public.automation_events FOR UPDATE TO authenticated
  USING (public.jwt_is_dispatcher_or_admin())
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $automation_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$automation_realtime$;

-- ---------------------------------------------------------------------------
-- Stage 15: analytics, optimization, and decision intelligence
-- Analytics snapshots are explainable, append-oriented decision inputs. They do
-- not mutate operational lifecycle state.
-- ---------------------------------------------------------------------------

DO $analytics_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'analytics_computation';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_event_kind') THEN
    CREATE TYPE public.analytics_event_kind AS ENUM (
      'metric_snapshot',
      'optimization_score',
      'lifecycle_trend',
      'workforce_insight',
      'financial_metric',
      'customer_experience_metric',
      'analytics_reconciliation'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_metric_kind') THEN
    CREATE TYPE public.analytics_metric_kind AS ENUM (
      'booking_completion_rate',
      'cleaner_acceptance_rate',
      'reassignment_frequency',
      'lateness_frequency',
      'customer_retention_rate',
      'cancellation_trend',
      'payout_latency',
      'dispatch_response_time',
      'message_response_time',
      'payment_failure_rate'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decision_score_kind') THEN
    CREATE TYPE public.decision_score_kind AS ENUM (
      'operational_risk',
      'assignment_confidence',
      'lateness_risk',
      'escalation_severity',
      'dispatch_health',
      'workforce_utilization'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_window') THEN
    CREATE TYPE public.analytics_window AS ENUM ('hour', 'day', 'week', 'month', 'quarter');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_visibility') THEN
    CREATE TYPE public.analytics_visibility AS ENUM ('admin', 'cleaner', 'customer', 'internal');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_event_status') THEN
    CREATE TYPE public.analytics_event_status AS ENUM ('fresh', 'stale', 'reconciled', 'failed');
  END IF;
END
$analytics_enums$;

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_kind public.analytics_event_kind NOT NULL,
  metric_kind public.analytics_metric_kind,
  score_kind public.decision_score_kind,
  window public.analytics_window NOT NULL DEFAULT 'day',
  visibility public.analytics_visibility NOT NULL DEFAULT 'admin',
  status public.analytics_event_status NOT NULL DEFAULT 'fresh',
  value numeric NOT NULL DEFAULT 0,
  score numeric(4, 3) CHECK (score IS NULL OR (score >= 0 AND score <= 1)),
  entity_kind text NOT NULL,
  entity_id uuid,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  cleaner_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments (id) ON DELETE SET NULL,
  formula text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanations text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_computed_idx
  ON public.analytics_events (computed_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_metric_idx
  ON public.analytics_events (metric_kind, window, computed_at DESC)
  WHERE metric_kind IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_score_idx
  ON public.analytics_events (score_kind, window, computed_at DESC)
  WHERE score_kind IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_entity_idx
  ON public.analytics_events (entity_kind, entity_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_booking_idx
  ON public.analytics_events (booking_id, computed_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_cleaner_idx
  ON public.analytics_events (cleaner_id, computed_at DESC)
  WHERE cleaner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_customer_idx
  ON public.analytics_events (customer_id, computed_at DESC)
  WHERE customer_id IS NOT NULL;

COMMENT ON TABLE public.analytics_events IS
  'Explainable operational metric snapshots and optimization scores. Analytics never mutates operational lifecycle state.';

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_events_select_role_visible ON public.analytics_events;
CREATE POLICY analytics_events_select_role_visible
  ON public.analytics_events FOR SELECT TO authenticated
  USING (
    public.jwt_is_dispatcher_or_admin()
    OR (visibility::text = 'cleaner' AND cleaner_id = auth.uid())
    OR (visibility::text = 'customer' AND customer_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = analytics_events.booking_id
        AND (b.customer_id = auth.uid() OR b.cleaner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS analytics_events_insert_staff ON public.analytics_events;
CREATE POLICY analytics_events_insert_staff
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $analytics_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$analytics_realtime$;

-- ---------------------------------------------------------------------------
-- Stage 16: scale architecture and multi-region readiness
-- Scale readiness records are advisory infrastructure snapshots. They document
-- topology, capacity, consistency, and failover posture without changing
-- operational state.
-- ---------------------------------------------------------------------------

DO $scale_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'scale_readiness';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scale_readiness_kind') THEN
    CREATE TYPE public.scale_readiness_kind AS ENUM (
      'region_health',
      'capacity_pressure',
      'consistency_lag',
      'provider_affinity',
      'realtime_fanout',
      'queue_backlog',
      'migration_safety',
      'failover_readiness'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scale_readiness_status') THEN
    CREATE TYPE public.scale_readiness_status AS ENUM (
      'ready',
      'observing',
      'degraded',
      'blocked'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scale_severity') THEN
    CREATE TYPE public.scale_severity AS ENUM ('low', 'normal', 'high', 'critical');
  END IF;
END
$scale_enums$;

CREATE TABLE IF NOT EXISTS public.scale_readiness_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.scale_readiness_kind NOT NULL,
  status public.scale_readiness_status NOT NULL DEFAULT 'ready',
  severity public.scale_severity NOT NULL DEFAULT 'low',
  region text,
  primary_region text,
  entity_kind text NOT NULL,
  entity_id uuid,
  score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 1),
  title text NOT NULL,
  summary text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommendations text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scale_readiness_events_created_idx
  ON public.scale_readiness_events (created_at DESC);
CREATE INDEX IF NOT EXISTS scale_readiness_events_region_idx
  ON public.scale_readiness_events (region, created_at DESC)
  WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS scale_readiness_events_kind_idx
  ON public.scale_readiness_events (kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS scale_readiness_events_entity_idx
  ON public.scale_readiness_events (entity_kind, entity_id, created_at DESC);

COMMENT ON TABLE public.scale_readiness_events IS
  'Append-oriented scale readiness snapshots for region topology, capacity, consistency, and failover posture.';

ALTER TABLE public.scale_readiness_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scale_readiness_events_select_staff ON public.scale_readiness_events;
CREATE POLICY scale_readiness_events_select_staff
  ON public.scale_readiness_events FOR SELECT TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

DROP POLICY IF EXISTS scale_readiness_events_insert_staff ON public.scale_readiness_events;
CREATE POLICY scale_readiness_events_insert_staff
  ON public.scale_readiness_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

-- ---------------------------------------------------------------------------
-- Stage 17: workforce intelligence and adaptive operations
-- Workforce intelligence is advisory and explainable. It records capacity,
-- fairness, burnout, resilience, and dispatch weighting signals without
-- mutating assignments or suppressing cleaners.
-- ---------------------------------------------------------------------------

DO $workforce_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'workforce_intelligence';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workforce_signal_kind') THEN
    CREATE TYPE public.workforce_signal_kind AS ENUM (
      'capacity_estimate',
      'workload_saturation',
      'shift_density',
      'burnout_risk',
      'fairness_balance',
      'payout_distribution',
      'dispatch_weighting',
      'resilience_risk',
      'coverage_gap',
      'elasticity_score'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workforce_severity') THEN
    CREATE TYPE public.workforce_severity AS ENUM ('low', 'normal', 'high', 'critical');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workforce_event_status') THEN
    CREATE TYPE public.workforce_event_status AS ENUM ('active', 'reviewed', 'dismissed', 'resolved');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workforce_visibility') THEN
    CREATE TYPE public.workforce_visibility AS ENUM ('admin', 'cleaner', 'internal');
  END IF;
END
$workforce_enums$;

CREATE TABLE IF NOT EXISTS public.workforce_intelligence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.workforce_signal_kind NOT NULL,
  severity public.workforce_severity NOT NULL DEFAULT 'low',
  status public.workforce_event_status NOT NULL DEFAULT 'active',
  visibility public.workforce_visibility NOT NULL DEFAULT 'admin',
  cleaner_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 1),
  title text NOT NULL,
  summary text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanations text[] NOT NULL DEFAULT ARRAY[]::text[],
  recommended_action text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workforce_intelligence_events_computed_idx
  ON public.workforce_intelligence_events (computed_at DESC);
CREATE INDEX IF NOT EXISTS workforce_intelligence_events_cleaner_idx
  ON public.workforce_intelligence_events (cleaner_id, computed_at DESC)
  WHERE cleaner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS workforce_intelligence_events_booking_idx
  ON public.workforce_intelligence_events (booking_id, computed_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS workforce_intelligence_events_kind_idx
  ON public.workforce_intelligence_events (kind, severity, computed_at DESC);

COMMENT ON TABLE public.workforce_intelligence_events IS
  'Explainable advisory workforce intelligence snapshots. These records never mutate assignments directly.';

ALTER TABLE public.workforce_intelligence_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workforce_intelligence_events_select_staff_or_cleaner ON public.workforce_intelligence_events;
CREATE POLICY workforce_intelligence_events_select_staff_or_cleaner
  ON public.workforce_intelligence_events FOR SELECT TO authenticated
  USING (
    public.jwt_is_dispatcher_or_admin()
    OR (visibility::text = 'cleaner' AND cleaner_id = auth.uid())
  );

DROP POLICY IF EXISTS workforce_intelligence_events_insert_staff ON public.workforce_intelligence_events;
CREATE POLICY workforce_intelligence_events_insert_staff
  ON public.workforce_intelligence_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $workforce_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workforce_intelligence_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$workforce_realtime$;

-- ---------------------------------------------------------------------------
-- Stage 18: AI-assisted operational tooling
-- AI assistance is mediated, advisory, and audit-safe. These records store
-- normalized assistance outputs, not raw model traces or autonomous mutations.
-- ---------------------------------------------------------------------------

DO $ai_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'ai_assistance';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_assistance_kind') THEN
    CREATE TYPE public.ai_assistance_kind AS ENUM (
      'dispatch_narrative',
      'booking_summary',
      'escalation_interpretation',
      'anomaly_explanation',
      'workforce_guidance',
      'financial_summary',
      'shift_summary'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_assistance_status') THEN
    CREATE TYPE public.ai_assistance_status AS ENUM (
      'draft',
      'ready',
      'accepted',
      'rejected',
      'overridden',
      'blocked'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_confidence') THEN
    CREATE TYPE public.ai_confidence AS ENUM ('low', 'medium', 'high');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_context_kind') THEN
    CREATE TYPE public.ai_context_kind AS ENUM (
      'booking_summary',
      'dispatch_context',
      'workforce_snapshot',
      'escalation_history',
      'financial_summary',
      'anomaly_context',
      'shift_overview'
    );
  END IF;
END
$ai_enums$;

CREATE TABLE IF NOT EXISTS public.ai_assistance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.ai_assistance_kind NOT NULL,
  status public.ai_assistance_status NOT NULL DEFAULT 'ready',
  confidence public.ai_confidence NOT NULL DEFAULT 'medium',
  context_kind public.ai_context_kind NOT NULL,
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  cleaner_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL,
  recommendation text NOT NULL,
  reasoning_summary text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  safety_flags text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepted_at timestamptz,
  rejected_at timestamptz,
  overridden_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_assistance_events_created_idx
  ON public.ai_assistance_events (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_assistance_events_booking_idx
  ON public.ai_assistance_events (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_assistance_events_cleaner_idx
  ON public.ai_assistance_events (cleaner_id, created_at DESC)
  WHERE cleaner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_assistance_events_kind_idx
  ON public.ai_assistance_events (kind, status, created_at DESC);

COMMENT ON TABLE public.ai_assistance_events IS
  'Mediated AI assistance outputs for operational review. AI assistance never mutates lifecycle state directly.';

ALTER TABLE public.ai_assistance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_assistance_events_select_staff ON public.ai_assistance_events;
CREATE POLICY ai_assistance_events_select_staff
  ON public.ai_assistance_events FOR SELECT TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

DROP POLICY IF EXISTS ai_assistance_events_insert_staff ON public.ai_assistance_events;
CREATE POLICY ai_assistance_events_insert_staff
  ON public.ai_assistance_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $ai_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_assistance_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$ai_realtime$;

-- ---------------------------------------------------------------------------
-- Stage 19: predictive operational systems
-- Predictions are advisory forecasts with confidence, probability, and source
-- reasoning. They never mutate lifecycle, dispatch, financial, or workforce
-- state directly.
-- ---------------------------------------------------------------------------

DO $predictive_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'predictive_forecast';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_kind') THEN
    CREATE TYPE public.prediction_kind AS ENUM (
      'sla_breach',
      'lateness',
      'reassignment',
      'cancellation',
      'operational_degradation',
      'workforce_volatility',
      'payment_failure',
      'payout_delay',
      'refund_anomaly'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_status') THEN
    CREATE TYPE public.prediction_status AS ENUM (
      'active',
      'accepted',
      'rejected',
      'overridden',
      'expired',
      'blocked'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_severity') THEN
    CREATE TYPE public.prediction_severity AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_context_kind') THEN
    CREATE TYPE public.prediction_context_kind AS ENUM (
      'sla_forecast',
      'workforce_volatility',
      'cancellation_reassignment',
      'financial_forecast',
      'operational_degradation'
    );
  END IF;
END
$predictive_enums$;

CREATE TABLE IF NOT EXISTS public.predictive_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.prediction_kind NOT NULL,
  status public.prediction_status NOT NULL DEFAULT 'active',
  severity public.prediction_severity NOT NULL DEFAULT 'low',
  confidence numeric(4, 3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  probability numeric(4, 3) NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 1),
  context_kind public.prediction_context_kind NOT NULL,
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  cleaner_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments (id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL,
  forecast text NOT NULL,
  reasoning text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  safety_flags text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  valid_until timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  overridden_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS predictive_events_created_idx
  ON public.predictive_events (created_at DESC);
CREATE INDEX IF NOT EXISTS predictive_events_booking_idx
  ON public.predictive_events (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS predictive_events_cleaner_idx
  ON public.predictive_events (cleaner_id, created_at DESC)
  WHERE cleaner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS predictive_events_payment_idx
  ON public.predictive_events (payment_id, created_at DESC)
  WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS predictive_events_kind_idx
  ON public.predictive_events (kind, status, created_at DESC);

COMMENT ON TABLE public.predictive_events IS
  'Explainable predictive forecasts for operational review. Predictions never mutate operational state directly.';

ALTER TABLE public.predictive_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS predictive_events_select_staff ON public.predictive_events;
CREATE POLICY predictive_events_select_staff
  ON public.predictive_events FOR SELECT TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

DROP POLICY IF EXISTS predictive_events_insert_staff ON public.predictive_events;
CREATE POLICY predictive_events_insert_staff
  ON public.predictive_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $predictive_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.predictive_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$predictive_realtime$;

-- ---------------------------------------------------------------------------
-- Stage 20: global operational orchestration
-- Federation events coordinate regional systems through central contracts.
-- They never define region-specific lifecycle semantics or move ownership
-- without governed operational review.
-- ---------------------------------------------------------------------------

DO $global_orchestration_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'global_orchestration';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'global_orchestration_kind') THEN
    CREATE TYPE public.global_orchestration_kind AS ENUM (
      'topology_snapshot',
      'routing_decision',
      'failover_recommendation',
      'realtime_federation',
      'workload_balance',
      'workforce_coordination',
      'financial_reconciliation',
      'predictive_coordination',
      'federation_conflict'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'global_orchestration_status') THEN
    CREATE TYPE public.global_orchestration_status AS ENUM (
      'observing',
      'coordinated',
      'review_required',
      'degraded',
      'blocked',
      'overridden'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'global_orchestration_severity') THEN
    CREATE TYPE public.global_orchestration_severity AS ENUM ('low', 'normal', 'high', 'critical');
  END IF;
END
$global_orchestration_enums$;

CREATE TABLE IF NOT EXISTS public.global_orchestration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.global_orchestration_kind NOT NULL,
  status public.global_orchestration_status NOT NULL DEFAULT 'observing',
  severity public.global_orchestration_severity NOT NULL DEFAULT 'low',
  origin_region text,
  target_region text,
  primary_region text,
  entity_kind text NOT NULL,
  entity_id text,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  cleaner_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments (id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL,
  governance_action text,
  reasoning text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  recommendations text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS global_orchestration_events_created_idx
  ON public.global_orchestration_events (created_at DESC);
CREATE INDEX IF NOT EXISTS global_orchestration_events_region_idx
  ON public.global_orchestration_events (origin_region, target_region, created_at DESC);
CREATE INDEX IF NOT EXISTS global_orchestration_events_kind_idx
  ON public.global_orchestration_events (kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS global_orchestration_events_booking_idx
  ON public.global_orchestration_events (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;

COMMENT ON TABLE public.global_orchestration_events IS
  'Governed global orchestration federation events. Regional systems coordinate through canonical contracts and never fork lifecycle semantics.';

ALTER TABLE public.global_orchestration_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS global_orchestration_events_select_staff ON public.global_orchestration_events;
CREATE POLICY global_orchestration_events_select_staff
  ON public.global_orchestration_events FOR SELECT TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

DROP POLICY IF EXISTS global_orchestration_events_insert_staff ON public.global_orchestration_events;
CREATE POLICY global_orchestration_events_insert_staff
  ON public.global_orchestration_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $global_orchestration_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.global_orchestration_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$global_orchestration_realtime$;

-- ---------------------------------------------------------------------------
-- Stage 21: governed self-healing operational infrastructure
-- Recovery recommendations mediate degradation signals through auditable,
-- explainable guidance. They never mutate lifecycle, failover, rollback, or
-- operational ownership directly.
-- ---------------------------------------------------------------------------

DO $self_healing_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'self_healing_recommendation';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recovery_kind') THEN
    CREATE TYPE public.recovery_kind AS ENUM (
      'subscription_recovery',
      'queue_stabilization',
      'provider_mediation',
      'region_containment',
      'reconciliation_repair',
      'rollback_advisory',
      'hydration_recovery',
      'resilience_forecast'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recovery_status') THEN
    CREATE TYPE public.recovery_status AS ENUM (
      'recommended',
      'review_required',
      'accepted',
      'rejected',
      'overridden',
      'blocked',
      'resolved'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recovery_severity') THEN
    CREATE TYPE public.recovery_severity AS ENUM ('low', 'normal', 'high', 'critical');
  END IF;
END
$self_healing_enums$;

CREATE TABLE IF NOT EXISTS public.self_healing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.recovery_kind NOT NULL,
  status public.recovery_status NOT NULL DEFAULT 'recommended',
  severity public.recovery_severity NOT NULL DEFAULT 'low',
  confidence numeric(4, 3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  degradation_score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (degradation_score >= 0 AND degradation_score <= 1),
  region text,
  provider text,
  entity_kind text NOT NULL,
  entity_id text,
  booking_id uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.cleaner_assignments (id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments (id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL,
  recommendation text NOT NULL,
  reasoning text[] NOT NULL DEFAULT ARRAY[]::text[],
  recovery_steps text[] NOT NULL DEFAULT ARRAY[]::text[],
  safety_flags text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepted_at timestamptz,
  rejected_at timestamptz,
  overridden_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS self_healing_events_created_idx
  ON public.self_healing_events (created_at DESC);
CREATE INDEX IF NOT EXISTS self_healing_events_kind_idx
  ON public.self_healing_events (kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS self_healing_events_region_idx
  ON public.self_healing_events (region, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS self_healing_events_booking_idx
  ON public.self_healing_events (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;

COMMENT ON TABLE public.self_healing_events IS
  'Governed operational resilience recommendations. Self-healing remains advisory, auditable, and cannot directly mutate operational state.';

ALTER TABLE public.self_healing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS self_healing_events_select_staff ON public.self_healing_events;
CREATE POLICY self_healing_events_select_staff
  ON public.self_healing_events FOR SELECT TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

DROP POLICY IF EXISTS self_healing_events_insert_staff ON public.self_healing_events;
CREATE POLICY self_healing_events_insert_staff
  ON public.self_healing_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $self_healing_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.self_healing_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$self_healing_realtime$;

-- ---------------------------------------------------------------------------
-- Stage 22: intelligent resilience automation infrastructure
-- Adaptive coordination recommends pacing, sequencing, and stabilization under
-- governance. It never executes failover, rollback, lifecycle mutation, or
-- operational ownership changes directly.
-- ---------------------------------------------------------------------------

DO $resilience_automation_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'resilience_automation';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resilience_automation_kind') THEN
    CREATE TYPE public.resilience_automation_kind AS ENUM (
      'adaptive_recovery_sequence',
      'congestion_stabilization',
      'reconciliation_throttling',
      'topology_recovery_mediation',
      'rollback_sequence',
      'predictive_resilience_pacing',
      'containment_assistance'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resilience_automation_status') THEN
    CREATE TYPE public.resilience_automation_status AS ENUM (
      'recommended',
      'review_required',
      'accepted',
      'rejected',
      'overridden',
      'blocked',
      'resolved'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resilience_automation_severity') THEN
    CREATE TYPE public.resilience_automation_severity AS ENUM ('low', 'normal', 'high', 'critical');
  END IF;
END
$resilience_automation_enums$;

CREATE TABLE IF NOT EXISTS public.resilience_automation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.resilience_automation_kind NOT NULL,
  status public.resilience_automation_status NOT NULL DEFAULT 'recommended',
  severity public.resilience_automation_severity NOT NULL DEFAULT 'low',
  priority_score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 1),
  congestion_score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (congestion_score >= 0 AND congestion_score <= 1),
  confidence numeric(4, 3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  pacing_window_seconds integer NOT NULL DEFAULT 0 CHECK (pacing_window_seconds >= 0),
  region text,
  provider text,
  entity_kind text NOT NULL,
  entity_id text,
  self_healing_event_id uuid REFERENCES public.self_healing_events (id) ON DELETE SET NULL,
  global_orchestration_event_id uuid REFERENCES public.global_orchestration_events (id) ON DELETE SET NULL,
  predictive_event_id uuid REFERENCES public.predictive_events (id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL,
  automation_guidance text NOT NULL,
  sequence_steps text[] NOT NULL DEFAULT ARRAY[]::text[],
  throttling_guidance text[] NOT NULL DEFAULT ARRAY[]::text[],
  reasoning text[] NOT NULL DEFAULT ARRAY[]::text[],
  safety_flags text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepted_at timestamptz,
  rejected_at timestamptz,
  overridden_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resilience_automation_events_created_idx
  ON public.resilience_automation_events (created_at DESC);
CREATE INDEX IF NOT EXISTS resilience_automation_events_kind_idx
  ON public.resilience_automation_events (kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS resilience_automation_events_region_idx
  ON public.resilience_automation_events (region, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS resilience_automation_events_priority_idx
  ON public.resilience_automation_events (priority_score DESC, congestion_score DESC, created_at DESC);

COMMENT ON TABLE public.resilience_automation_events IS
  'Governed adaptive resilience coordination recommendations. Resilience automation remains auditable and cannot directly mutate operational state.';

ALTER TABLE public.resilience_automation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resilience_automation_events_select_staff ON public.resilience_automation_events;
CREATE POLICY resilience_automation_events_select_staff
  ON public.resilience_automation_events FOR SELECT TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

DROP POLICY IF EXISTS resilience_automation_events_insert_staff ON public.resilience_automation_events;
CREATE POLICY resilience_automation_events_insert_staff
  ON public.resilience_automation_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $resilience_automation_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.resilience_automation_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$resilience_automation_realtime$;

-- ---------------------------------------------------------------------------
-- Stage 23: autonomous optimization safeguards infrastructure
-- Optimization safeguards evaluate boundaries, integrity, and rollback posture
-- under governance. They never execute topology, lifecycle, rollback, or
-- ownership mutations directly.
-- ---------------------------------------------------------------------------

DO $optimization_safeguard_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'optimization_safeguard';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'optimization_safeguard_kind') THEN
    CREATE TYPE public.optimization_safeguard_kind AS ENUM (
      'boundary_evaluation',
      'integrity_protection',
      'topology_constraint',
      'resilience_bound',
      'rollback_safeguard',
      'predictive_safeguard',
      'suppression_advisory'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'optimization_safeguard_status') THEN
    CREATE TYPE public.optimization_safeguard_status AS ENUM (
      'recommended',
      'review_required',
      'accepted',
      'rejected',
      'overridden',
      'blocked',
      'resolved'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'optimization_safeguard_severity') THEN
    CREATE TYPE public.optimization_safeguard_severity AS ENUM ('low', 'normal', 'high', 'critical');
  END IF;
END
$optimization_safeguard_enums$;

CREATE TABLE IF NOT EXISTS public.optimization_safeguard_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.optimization_safeguard_kind NOT NULL,
  status public.optimization_safeguard_status NOT NULL DEFAULT 'recommended',
  severity public.optimization_safeguard_severity NOT NULL DEFAULT 'low',
  optimization_score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (optimization_score >= 0 AND optimization_score <= 1),
  risk_score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 1),
  integrity_score numeric(4, 3) NOT NULL DEFAULT 1 CHECK (integrity_score >= 0 AND integrity_score <= 1),
  confidence numeric(4, 3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  region text,
  provider text,
  entity_kind text NOT NULL,
  entity_id text,
  resilience_automation_event_id uuid REFERENCES public.resilience_automation_events (id) ON DELETE SET NULL,
  predictive_event_id uuid REFERENCES public.predictive_events (id) ON DELETE SET NULL,
  global_orchestration_event_id uuid REFERENCES public.global_orchestration_events (id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL,
  safeguard_guidance text NOT NULL,
  constraints text[] NOT NULL DEFAULT ARRAY[]::text[],
  rollback_guidance text[] NOT NULL DEFAULT ARRAY[]::text[],
  reasoning text[] NOT NULL DEFAULT ARRAY[]::text[],
  safety_flags text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepted_at timestamptz,
  rejected_at timestamptz,
  overridden_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS optimization_safeguard_events_created_idx
  ON public.optimization_safeguard_events (created_at DESC);
CREATE INDEX IF NOT EXISTS optimization_safeguard_events_kind_idx
  ON public.optimization_safeguard_events (kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS optimization_safeguard_events_region_idx
  ON public.optimization_safeguard_events (region, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS optimization_safeguard_events_risk_idx
  ON public.optimization_safeguard_events (risk_score DESC, integrity_score ASC, created_at DESC);

COMMENT ON TABLE public.optimization_safeguard_events IS
  'Governed autonomous optimization safeguards. Optimization guidance is auditable and cannot directly mutate operational state.';

ALTER TABLE public.optimization_safeguard_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS optimization_safeguard_events_select_staff ON public.optimization_safeguard_events;
CREATE POLICY optimization_safeguard_events_select_staff
  ON public.optimization_safeguard_events FOR SELECT TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

DROP POLICY IF EXISTS optimization_safeguard_events_insert_staff ON public.optimization_safeguard_events;
CREATE POLICY optimization_safeguard_events_insert_staff
  ON public.optimization_safeguard_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $optimization_safeguard_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.optimization_safeguard_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$optimization_safeguard_realtime$;

-- ---------------------------------------------------------------------------
-- Stage 24: federated operational intelligence governance
-- Governance events mediate distributed intelligence, trust, drift, policy, and
-- override assurance. They never enforce governance corrections or mutate
-- lifecycle state directly.
-- ---------------------------------------------------------------------------

DO $federated_governance_enums$
BEGIN
  BEGIN
    ALTER TYPE public.operational_audit_action ADD VALUE IF NOT EXISTS 'federated_governance';
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'federated_governance_kind') THEN
    CREATE TYPE public.federated_governance_kind AS ENUM (
      'policy_coordination',
      'governance_drift',
      'trust_mediation',
      'topology_governance',
      'override_assurance',
      'predictive_governance',
      'policy_conflict'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'federated_governance_status') THEN
    CREATE TYPE public.federated_governance_status AS ENUM (
      'observing',
      'recommended',
      'review_required',
      'accepted',
      'rejected',
      'overridden',
      'blocked',
      'resolved'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'federated_governance_severity') THEN
    CREATE TYPE public.federated_governance_severity AS ENUM ('low', 'normal', 'high', 'critical');
  END IF;
END
$federated_governance_enums$;

CREATE TABLE IF NOT EXISTS public.federated_governance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.federated_governance_kind NOT NULL,
  status public.federated_governance_status NOT NULL DEFAULT 'recommended',
  severity public.federated_governance_severity NOT NULL DEFAULT 'low',
  trust_score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 1),
  drift_score numeric(4, 3) NOT NULL DEFAULT 0 CHECK (drift_score >= 0 AND drift_score <= 1),
  policy_integrity_score numeric(4, 3) NOT NULL DEFAULT 1 CHECK (policy_integrity_score >= 0 AND policy_integrity_score <= 1),
  confidence numeric(4, 3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  region text,
  domain text NOT NULL,
  entity_kind text NOT NULL,
  entity_id text,
  optimization_safeguard_event_id uuid REFERENCES public.optimization_safeguard_events (id) ON DELETE SET NULL,
  predictive_event_id uuid REFERENCES public.predictive_events (id) ON DELETE SET NULL,
  global_orchestration_event_id uuid REFERENCES public.global_orchestration_events (id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text NOT NULL,
  governance_guidance text NOT NULL,
  policy_constraints text[] NOT NULL DEFAULT ARRAY[]::text[],
  override_guidance text[] NOT NULL DEFAULT ARRAY[]::text[],
  reasoning text[] NOT NULL DEFAULT ARRAY[]::text[],
  safety_flags text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_refs text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepted_at timestamptz,
  rejected_at timestamptz,
  overridden_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS federated_governance_events_created_idx
  ON public.federated_governance_events (created_at DESC);
CREATE INDEX IF NOT EXISTS federated_governance_events_kind_idx
  ON public.federated_governance_events (kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS federated_governance_events_region_domain_idx
  ON public.federated_governance_events (region, domain, created_at DESC);
CREATE INDEX IF NOT EXISTS federated_governance_events_drift_idx
  ON public.federated_governance_events (drift_score DESC, trust_score ASC, created_at DESC);

COMMENT ON TABLE public.federated_governance_events IS
  'Federated operational intelligence governance events. Governance remains advisory, auditable, and cannot directly mutate operational state.';

ALTER TABLE public.federated_governance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS federated_governance_events_select_staff ON public.federated_governance_events;
CREATE POLICY federated_governance_events_select_staff
  ON public.federated_governance_events FOR SELECT TO authenticated
  USING (public.jwt_is_dispatcher_or_admin());

DROP POLICY IF EXISTS federated_governance_events_insert_staff ON public.federated_governance_events;
CREATE POLICY federated_governance_events_insert_staff
  ON public.federated_governance_events FOR INSERT TO authenticated
  WITH CHECK (public.jwt_is_dispatcher_or_admin());

DO $federated_governance_realtime$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.federated_governance_events;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END
$federated_governance_realtime$;
