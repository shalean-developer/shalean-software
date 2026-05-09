-- Outbox worker concurrency: row-level locks + leases for multi-instance safety.

ALTER TABLE public.notification_outbox
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz;

COMMENT ON COLUMN public.notification_outbox.processing_started_at IS
  'When the worker claimed this row (status processing).';
COMMENT ON COLUMN public.notification_outbox.lease_expires_at IS
  'Lease expiry; stale processing rows are reclaimable by other workers.';

-- Atomically claim pending rows (or reclaim expired leases) using SKIP LOCKED.
CREATE OR REPLACE FUNCTION public.notification_outbox_claim_batch(
  p_limit integer,
  p_lease_seconds integer
)
RETURNS SETOF public.notification_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
  v_secs integer := LEAST(GREATEST(COALESCE(p_lease_seconds, 180), 30), 3600);
  v_lease interval := (v_secs::text || ' seconds')::interval;
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT o.id
    FROM public.notification_outbox o
    WHERE o.attempts < 8
      AND (
        o.status = 'pending'
        OR (
          o.status = 'processing'
          AND o.lease_expires_at IS NOT NULL
          AND o.lease_expires_at < now()
        )
      )
    ORDER BY o.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT v_limit
  ),
  updated AS (
    UPDATE public.notification_outbox u
    SET
      status = 'processing',
      processing_started_at = now(),
      lease_expires_at = now() + v_lease
    FROM candidates c
    WHERE u.id = c.id
    RETURNING u.*
  )
  SELECT * FROM updated;
END;
$$;

ALTER FUNCTION public.notification_outbox_claim_batch(integer, integer) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.notification_outbox_claim_batch(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notification_outbox_claim_batch(integer, integer) TO service_role;

COMMENT ON FUNCTION public.notification_outbox_claim_batch(integer, integer) IS
  'Claims pending or stale leased notification_outbox rows for exactly one worker (SKIP LOCKED).';
