-- Cleaning services operational platform — core schema
-- UUID PKs, enums, lifecycle events, payments, indexes, append-only event log helpers

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM (
  'customer',
  'cleaner',
  'dispatcher',
  'admin'
);

CREATE TYPE public.booking_status AS ENUM (
  'draft',
  'awaiting_payment',
  'paid',
  'assigned',
  'cleaner_en_route',
  'in_progress',
  'completed',
  'cancelled',
  'refunded'
);

CREATE TYPE public.booking_event_type AS ENUM (
  'BOOKING_CREATED',
  'PAYMENT_RECEIVED',
  'BOOKING_ASSIGNED',
  'CLEANER_EN_ROUTE',
  'BOOKING_STARTED',
  'BOOKING_COMPLETED',
  'BOOKING_CANCELLED',
  'BOOKING_REFUNDED'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'processing',
  'requires_action',
  'succeeded',
  'failed',
  'canceled',
  'refunded',
  'partially_refunded'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- users (operational profile; 1:1 with auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'customer',
  display_name text,
  phone text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_phone_e164_chk CHECK (
    phone IS NULL OR phone ~ '^\+[1-9]\d{1,14}$'
  )
);

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.users IS 'Operational user profile; primary key mirrors auth.users.id';

-- ---------------------------------------------------------------------------
-- bookings (operational source of truth)
-- ---------------------------------------------------------------------------

CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  cleaner_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  status public.booking_status NOT NULL DEFAULT 'draft',
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  service_timezone text NOT NULL DEFAULT 'UTC',
  address_line1 text NOT NULL,
  address_line2 text,
  locality text,
  region text,
  postal_code text,
  country_code char(2) NOT NULL DEFAULT 'US',
  latitude double precision,
  longitude double precision,
  service_notes text,
  internal_notes text,
  currency char(3) NOT NULL DEFAULT 'USD',
  subtotal_cents bigint NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  fees_cents bigint NOT NULL DEFAULT 0,
  tax_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  cancel_reason text,
  cancelled_at timestamptz,
  completed_at timestamptz,
  row_version integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_schedule_chk CHECK (scheduled_end > scheduled_start),
  CONSTRAINT bookings_cancelled_at_chk CHECK (
    (status = 'cancelled') = (cancelled_at IS NOT NULL)
  ),
  CONSTRAINT bookings_completed_at_chk CHECK (
    (status = 'completed') = (completed_at IS NOT NULL)
  )
);

CREATE TRIGGER bookings_set_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.bookings_bump_row_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.row_version := OLD.row_version + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_bump_row_version
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.bookings_bump_row_version();

COMMENT ON TABLE public.bookings IS 'Operational source of truth for a cleaning job';
COMMENT ON COLUMN public.bookings.row_version IS 'Optimistic concurrency; increment on each update from application';

-- ---------------------------------------------------------------------------
-- booking_events (append-only lifecycle / audit stream)
-- ---------------------------------------------------------------------------

CREATE TABLE public.booking_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  event_type public.booking_event_type NOT NULL,
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  idempotency_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_events_idempotency_len_chk CHECK (
    idempotency_key IS NULL OR char_length(idempotency_key) <= 256
  )
);

CREATE UNIQUE INDEX booking_events_idempotency_uidx
  ON public.booking_events (booking_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.booking_events_prevent_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'booking_events are append-only (booking_id=%)', OLD.booking_id
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

-- Append-only row updates (deletes allowed so ON DELETE CASCADE from bookings works)
CREATE TRIGGER booking_events_no_update
BEFORE UPDATE ON public.booking_events
FOR EACH ROW
EXECUTE FUNCTION public.booking_events_prevent_update();

COMMENT ON TABLE public.booking_events IS 'Append-only stream; pair with triggers on bookings for centralized lifecycle';

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------

CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE RESTRICT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'stripe',
  provider_intent_id text,
  provider_charge_id text,
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  currency char(3) NOT NULL DEFAULT 'USD',
  captured_at timestamptz,
  failure_code text,
  failure_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX payments_provider_intent_uidx
  ON public.payments (provider, provider_intent_id)
  WHERE provider_intent_id IS NOT NULL;

CREATE UNIQUE INDEX payments_provider_charge_uidx
  ON public.payments (provider, provider_charge_id)
  WHERE provider_charge_id IS NOT NULL;

COMMENT ON TABLE public.payments IS 'Payment attempts and captures; booking remains source of truth for job state';

-- ---------------------------------------------------------------------------
-- Centralized booking lifecycle: emit events from booking mutations
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bookings_emit_lifecycle_event()
RETURNS trigger
LANGUAGE plpgsql
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

CREATE TRIGGER bookings_emit_lifecycle_event_ins
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.bookings_emit_lifecycle_event();

CREATE TRIGGER bookings_emit_lifecycle_event_upd
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.bookings_emit_lifecycle_event();

-- ---------------------------------------------------------------------------
-- Indexes (operational queries, dashboards, assignment)
-- ---------------------------------------------------------------------------

CREATE INDEX bookings_customer_created_idx
  ON public.bookings (customer_id, created_at DESC);

CREATE INDEX bookings_cleaner_schedule_idx
  ON public.bookings (cleaner_id, scheduled_start)
  WHERE cleaner_id IS NOT NULL;

CREATE INDEX bookings_status_schedule_idx
  ON public.bookings (status, scheduled_start);

CREATE INDEX bookings_schedule_start_idx
  ON public.bookings (scheduled_start);

CREATE INDEX booking_events_booking_created_idx
  ON public.booking_events (booking_id, created_at DESC);

CREATE INDEX booking_events_type_created_idx
  ON public.booking_events (event_type, created_at DESC);

CREATE INDEX payments_booking_idx
  ON public.payments (booking_id, created_at DESC);

CREATE INDEX payments_status_created_idx
  ON public.payments (status, created_at DESC);

-- Dispatch / calendar: non-terminal jobs by schedule
CREATE INDEX bookings_active_schedule_idx
  ON public.bookings (scheduled_start)
  WHERE status NOT IN ('completed', 'cancelled', 'refunded');
