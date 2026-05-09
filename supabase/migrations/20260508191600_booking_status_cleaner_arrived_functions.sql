-- Runs after 20260508191500: functions may reference new enum literals only after they commit.

-- ---------------------------------------------------------------------------
-- 1) Lifecycle emitter — map cleaner_arrived to audit event type
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
      WHEN 'cleaner_arrived' THEN 'CLEANER_ARRIVED'::public.booking_event_type
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

-- ---------------------------------------------------------------------------
-- 2) Status edges — keep aligned with lib/bookings/lifecycle/transitions.ts
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
          'cleaner_arrived'::public.booking_status,
          'in_progress'::public.booking_status,
          'cancelled'::public.booking_status
        )
      WHEN 'cleaner_en_route'::public.booking_status THEN
        to_s IN (
          'cleaner_arrived'::public.booking_status,
          'in_progress'::public.booking_status,
          'cancelled'::public.booking_status
        )
      WHEN 'cleaner_arrived'::public.booking_status THEN
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
