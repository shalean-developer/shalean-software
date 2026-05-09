# Deployment & operations

Companion files: `.env.example`, `env.local.template`, `supabase/scripts/`.

## Local vs production

| Concern | Local (`.env.local`) | Production |
|---------|---------------------|------------|
| Supabase | Dev/staging project keys | Production project; distinct service role |
| Paystack | Test keys (`sk_test_` / `pk_test_`) | Live keys |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical HTTPS origin |
| `NOTIFICATIONS_CRON_SECRET` | Dev secret | Strong random; matches Vault `notifications_cron_secret` |
| Scheduler | Manual `curl` or hit `/api/cron/notifications` with Bearer | **Supabase pg_cron** (below) |

Never reuse production secrets in staging.

## Required operational variables (production)

Validated at startup and by readiness checks: see `lib/runtime/` and `lib/config/production-env.ts`.

**Required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `RESEND_API_KEY`, `NOTIFICATIONS_FROM_EMAIL`, `NOTIFICATIONS_CRON_SECRET`.

**Recommended:** `NOTIFICATIONS_FROM_NAME`, `NOTIFICATIONS_ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`, `NOTIFICATION_OUTBOX_LEASE_SECONDS`.

**Governance:** If `RECONCILIATION_OVERRIDE_ENABLED=true`, set `RECONCILIATION_OVERRIDE_SECRET` (≥ 16 chars).

**Diagnostics:** `TEMP_ROLE_DIAG_ENABLED` — leave unset/false in production unless investigating JWT role issues.

## Scale and multi-region readiness

Scale readiness is observational until a dedicated multi-region database strategy is approved. Runtime helpers in `lib/scale/` track region topology, capacity pressure, consistency lag, and primary-routing requirements without changing operational state.

Recommended production variables:

- `SCALE_PRIMARY_REGION` — canonical write/freshness region.
- `SCALE_ALLOWED_REGIONS` — comma-separated deployment regions allowed to serve traffic.
- `SCALE_CONSISTENCY_BUDGET_MS` — max acceptable event freshness lag before readiness degrades.
- `SCALE_DISPATCH_WORKERS`, `SCALE_DISPATCH_TARGET_PER_WORKER` — dispatch queue capacity assumptions.
- `SCALE_NOTIFICATION_WORKERS`, `SCALE_NOTIFICATION_TARGET_PER_WORKER` — outbox capacity assumptions.

Rules:

- Fresh writes, webhooks, financial operations, and freshness-sensitive reads stay primary-bound.
- Cross-region behavior is monitored through `/api/health` and `/api/ready`; blocked scale readiness returns deployment readiness failure.
- `scale_readiness_events` stores staff-visible topology/capacity/consistency snapshots for operational review.

## Supabase-native notification scheduler (Stage 14)

Vercel Cron is **not** used. The Next.js route **`/api/cron/notifications`** (GET/POST) stays the single worker entrypoint: Bearer **`NOTIFICATIONS_CRON_SECRET`**, lease-based **`notification_outbox_claim_batch`**, structured monitoring unchanged.

### Strategy

1. **[pg_cron](https://supabase.com/docs/guides/database/extensions/pgcron)** — recurring schedule inside Postgres.  
2. **[pg_net](https://supabase.com/docs/guides/database/extensions/pgnet)** — async HTTP POST from the database.  
3. **[Vault](https://supabase.com/docs/guides/database/vault)** — encrypted storage for **app URL** and **cron Bearer token** (never commit secrets in SQL).

### Secure invocation

- Only **postgres** (SQL Editor / migrations) configures Vault + cron.  
- Next.js validates **`Authorization: Bearer …`** against **`NOTIFICATIONS_CRON_SECRET`** — use the **same** value as Vault secret `notifications_cron_secret`.  
- Least privilege: do not grant API roles access to `vault.decrypted_secrets`.

### Operator steps

1. Dashboard → **Database → Extensions** → enable **pg_cron**, **pg_net**, **Vault** (supabase_vault).  
   - Until **pg_cron** is enabled, the `cron` schema does not exist and `cron.schedule` / `cron.unschedule` will fail with `schema "cron" does not exist`.  
   - The schedule script also tries `CREATE EXTENSION IF NOT EXISTS pg_cron` — if that fails in SQL Editor, use the Dashboard toggle instead.  
2. SQL Editor — create Vault secrets (replace placeholders):

   ```sql
   select vault.create_secret('https://your-production-domain.com', 'notification_app_url', 'Next origin, no trailing slash');
   select vault.create_secret('your-notifications-cron-secret', 'notifications_cron_secret', 'Matches NOTIFICATIONS_CRON_SECRET on Next.js host');
   ```

3. Run `supabase/scripts/schedule-notification-outbox-worker.sql` (creates job `notification-outbox-worker`, default **every 2 minutes**).  
4. Confirm `net._http_response` / logs if troubleshooting pg_net delivery.

### Edge Function alternative (not shipped)

If HTTP-from-Postgres is undesirable, deploy a **scheduled Edge Function** that `fetch`es your Next URL with the same Bearer secret; store URL + secret in **Edge Function secrets**. Trade-off: extra runtime and deploy surface; pg_cron + Vault stays closest to Supabase docs and preserves one worker implementation.

## Runtime health and readiness

- `GET /api/health` reports environment validation, provider configuration status, deployment metadata, and uptime probe telemetry.
- `GET /api/ready` performs deploy readiness and scale topology guards, returning `503` when required production configuration or region posture is blocked.
- Startup validation runs from `instrumentation.ts`; failures are logged through the centralized observability pipeline and do not put production-only logic in UI components.

## Paystack webhook checklist

1. Deploy app with `/api/webhooks/paystack` on HTTPS.  
2. Paystack dashboard → webhook URL `https://<domain>/api/webhooks/paystack`.  
3. Production **`SUPABASE_SERVICE_ROLE_KEY`** on the Next host.  
4. **`PAYSTACK_SECRET_KEY`** matches Paystack project.  
5. Watch logs for `paystack.webhook.*`, `production.error`, and reconciliation incidents.

## Supabase migrations

1. Apply migrations to staging, then production (`supabase db push` or CI).  
2. Outbox concurrency requires `20260509120000_notification_outbox_lease_claim.sql`.  
3. Admin analytics outbox visibility requires `20260509180000_notification_outbox_staff_select_analytics.sql`.

### Rollback

- **Pause notifications:** run `supabase/scripts/unschedule-notification-outbox-worker.sql`.  
- **Forward-fix** schema; avoid deleting `notification_outbox` rows in rollback scripts.  
- **Webhook:** disable URL in Paystack dashboard for instant stop.
- **Hosting:** promote or redeploy the previous known-good artifact; keep database recovery forward-only unless a tested rollback plan exists.

## Backup and recovery preparation

- Enable Supabase point-in-time recovery/backups for production before accepting live payments.
- Validate restore into staging before any major schema migration.
- Keep financial migrations additive where possible; never rewrite invoice or payment history during rollback.
- Treat notification queues and webhook events as recoverable operational logs, not disposable cache.

## Operational runbook (short)

- **Outbox not draining:** migration applied? Resend env on Next? pg_cron job exists (`SELECT * FROM cron.job`)? Vault names correct?  
- **401 from cron route:** Bearer mismatch between Vault and Next `NOTIFICATIONS_CRON_SECRET`.  
- **Expired leases:** monitoring `notification_outbox.expired_leases_pending_reclaim` — reclaimed on next tick.

## Testing

- `npm run deploy:check` before promote.  
- `npm run test` before promote when test fixtures are healthy.  
- `npm run build` must pass in the deployment environment.  
- After scheduling: trigger one manual POST to `/api/cron/notifications` with Bearer and inspect JSON `summary`.

## Deployment pipeline

The repo ships a minimal GitHub Actions workflow at `.github/workflows/deployment-readiness.yml`:

1. `npm ci`
2. `npm run deploy:check`
3. `npm run build`

Vercel Git deployments can still produce preview and production builds. Use `/api/ready` as a post-deploy readiness probe before promoting a preview deployment to production.

## Deployment confidence checklist (Stage 18)

Before promoting **production**:

1. Required env vars present — see **Required operational variables** above; confirm no test Paystack keys on prod host.
2. Latest Supabase migrations applied; lease/outbox policies deployed where analytics reads `notification_outbox`.
3. Paystack webhook URL points at production `/api/webhooks/paystack`; signing secret matches dashboard.
4. pg_cron job scheduled **or** documented alternate worker; trial Bearer hit returns `{ ok: true }`.
5. `GET /api/ready` returns `{ ok: true }` in the target deployment.
6. `GET /api/health` shows no misconfigured providers and `scale.ok=true`.
7. Current `VERCEL_REGION` is included in `SCALE_ALLOWED_REGIONS` or documented as the primary region.
8. Smoke: create draft booking → payment test mode **or** reconcile path verified on staging first.

**Application rollback (hosting):** redeploy the previous known-good deployment artifact (e.g. Vercel “Promote” prior deployment). Database rollback stays **forward-fix** except for pausing cron via `unschedule-notification-outbox-worker.sql`.

## Startup validation

`instrumentation.ts` runs centralized runtime startup validation once on Node boot (warn-only logs, readiness endpoint fails closed for missing required production configuration).
