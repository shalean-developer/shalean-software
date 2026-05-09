-- Remove pg_cron job for notification outbox worker (rollback / pause notifications drain).
--
-- If you see: schema "cron" does not exist → enable pg_cron first (see
-- schedule-notification-outbox-worker.sql) or Dashboard → Database → Extensions → pg_cron.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Returns true if a job was removed; false if the job name did not exist.
SELECT cron.unschedule('notification-outbox-worker');
