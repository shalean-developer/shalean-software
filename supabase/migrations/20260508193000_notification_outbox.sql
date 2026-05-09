-- Operational email outbox: event-driven from booking_events + payment failures.
-- Does NOT mutate bookings, payments, or booking_events — enqueue only.

CREATE TABLE public.notification_outbox (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dedupe_key text NOT NULL,
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  booking_event_id uuid REFERENCES public.booking_events (id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments (id) ON DELETE CASCADE,
  event_kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CONSTRAINT notification_outbox_status_chk
      CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0 CONSTRAINT notification_outbox_attempts_chk CHECK (attempts >= 0),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT notification_outbox_dedupe_uidx UNIQUE (dedupe_key)
);

CREATE INDEX notification_outbox_pending_created_idx
  ON public.notification_outbox (created_at ASC)
  WHERE status = 'pending';

COMMENT ON TABLE public.notification_outbox IS
  'Side-effect queue for operational emails; workers use service_role. Lifecycle/booking_events remain source of truth.';

-- ---------------------------------------------------------------------------
-- Enqueue from booking_events (append-only stream)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notification_enqueue_from_booking_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.event_type IN (
    'BOOKING_CREATED'::public.booking_event_type,
    'PAYMENT_RECEIVED'::public.booking_event_type,
    'BOOKING_ASSIGNED'::public.booking_event_type,
    'CLEANER_EN_ROUTE'::public.booking_event_type,
    'BOOKING_COMPLETED'::public.booking_event_type
  ) THEN
    INSERT INTO public.notification_outbox (
      dedupe_key,
      booking_id,
      booking_event_id,
      event_kind,
      payload,
      status
    )
    VALUES (
      'be:' || NEW.id::text,
      NEW.booking_id,
      NEW.id,
      NEW.event_type::text,
      jsonb_build_object(
        'event_type', NEW.event_type::text,
        'payload', NEW.payload,
        'created_at', NEW.created_at
      ),
      'pending'
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.notification_enqueue_from_booking_event() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.notification_enqueue_from_booking_event() FROM PUBLIC;

DROP TRIGGER IF EXISTS notification_outbox_enqueue_booking_event ON public.booking_events;

CREATE TRIGGER notification_outbox_enqueue_booking_event
AFTER INSERT ON public.booking_events
FOR EACH ROW
EXECUTE FUNCTION public.notification_enqueue_from_booking_event();

COMMENT ON FUNCTION public.notification_enqueue_from_booking_event IS
  'SECURITY DEFINER: enqueues notification rows; never mutates operational booking state.';

-- ---------------------------------------------------------------------------
-- Enqueue payment failed (not always represented as booking_events)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notification_enqueue_payment_failed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'failed'::public.payment_status THEN
    IF TG_OP = 'INSERT' OR (OLD IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status) THEN
      INSERT INTO public.notification_outbox (
        dedupe_key,
        booking_id,
        payment_id,
        event_kind,
        payload,
        status
      )
      VALUES (
        'pf:' || NEW.id::text,
        NEW.booking_id,
        NEW.id,
        'PAYMENT_FAILED',
        jsonb_build_object(
          'payment_id', NEW.id,
          'booking_id', NEW.booking_id,
          'failure_code', NEW.failure_code,
          'failure_message', NEW.failure_message,
          'amount_cents', NEW.amount_cents,
          'currency', NEW.currency,
          'provider', NEW.provider
        ),
        'pending'
      )
      ON CONFLICT (dedupe_key) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.notification_enqueue_payment_failed() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.notification_enqueue_payment_failed() FROM PUBLIC;

DROP TRIGGER IF EXISTS notification_enqueue_payment_failed ON public.payments;

CREATE TRIGGER notification_enqueue_payment_failed
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notification_enqueue_payment_failed();

-- ---------------------------------------------------------------------------
-- Grants: no authenticated access; service_role worker + postgres triggers
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.notification_outbox FROM PUBLIC;
REVOKE ALL ON TABLE public.notification_outbox FROM anon;
REVOKE ALL ON TABLE public.notification_outbox FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_outbox TO service_role;

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- Explicit deny for JWT roles (service_role bypasses RLS)
CREATE POLICY notification_outbox_deny_authenticated
  ON public.notification_outbox
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
