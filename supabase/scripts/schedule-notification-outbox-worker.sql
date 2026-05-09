-- -----------------------------------------------------------------------------
-- Schedule notification outbox processing (Supabase pg_cron + pg_net + Vault)
-- -----------------------------------------------------------------------------
-- If you see: schema "cron" does not exist → pg_cron is not enabled yet.
--
-- Enable extensions (pick one path):
--   A) Dashboard → Database → Extensions → enable **pg_cron**, **pg_net**, Vault
--   B) Run the block below in SQL Editor (requires privileges; if it errors, use A)
--
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
--
-- Vault: enable **supabase_vault** (Dashboard → Extensions) if `vault.create_secret` is missing.
--
-- 1) Store secrets (run once per project; rotate by updating vault secrets):
--
--    select vault.create_secret('https://your-app.example.com', 'notification_app_url', 'Next.js origin — no trailing slash');
--    select vault.create_secret('same-value-as-next-env-NOTIFICATIONS_CRON_SECRET', 'notifications_cron_secret', 'Bearer token for /api/cron/notifications');
--
-- 2) Schedule HTTP POST every 2 minutes (adjust cron expression as needed).
--    Run in Supabase SQL Editor as postgres.
--
-- Retry-safe: each tick is independent; outbox worker uses SKIP LOCKED + leases.
-- Idempotency: unchanged — enforced by outbox dedupe keys + claim RPC.
-- -----------------------------------------------------------------------------

SELECT cron.schedule(
  'notification-outbox-worker',
  '*/2 * * * *',
  $cron$
  SELECT net.http_post(
    url := regexp_replace((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'notification_app_url')::text, '/+$', '') || '/api/cron/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'notifications_cron_secret')::text
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
