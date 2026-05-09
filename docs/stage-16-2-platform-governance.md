# Stage 16.2 — Platform Governance, Reliability & Enterprise Readiness

Governance and reliability maturation for durable operational infrastructure. **No duplicate operational truth**, no unsafe automation, no bypass of centralized lifecycle authority.

---

## 1. Implementation plan

**Shipped in codebase**

| Area | Change |
|------|--------|
| Failure visibility | Monitoring: outbox pending/processing/stale-lease counts; samples of failed rows (`last_error`) and stale leases |
| Recovery guidance | `RECOVERY_PLAYBOOK_SECTIONS`, failure taxonomy (`OPERATIONAL_INCIDENT_DESCRIPTORS`), reliability overview on `/admin/monitoring` |
| Lifecycle failures | Dispatcher form: `lifecycleTransitionRecoveryHint(code)` after failed transitions |
| Governance UX | Operations booking detail: accountability copy; lifecycle timeline shows **actor** vs **system/trigger** |
| Audit traceability | `booking_events` queries include `actor_user_id` for admin/cleaner/customer detail loads |
| Support hub | Card linking anchors on Monitoring for reliability, outbox recovery, playbook, taxonomy |
| Maintainability | `operations-command-bar`: `Link` + `buttonVariants` (Base UI Button has no `asChild`) |
| Compliance hooks | `OPERATIONAL_RECORD_CLASSES`, `AUDIT_EXPORT_READINESS_COPY`, `DATA_RETENTION_HOOKS_COPY` in `lib/operational/reliability/` |

**Backlog (incremental)**

- Optional JSON/CSV export of `loadAdminAnalyticsSnapshot` / `loadOperationalMonitoringSnapshot` for offline reporting (same queries).
- Log drain dashboards keyed on existing `emitMonitoringEvent` event names.
- Role audit table link from governance card when admins need override frequency visibility.

---

## 2. Reliability maturity roadmap

| Phase | Focus |
|-------|--------|
| **Now** | Single Monitoring surface for queues, payments, outbox, reconciliation sample + playbook |
| **Next** | Metrics on webhook latency (instrument route once; still no fake realtime) |
| **Scale** | Warehouse rollups when head-query samples truncate; outbox lease alerts in external monitoring |

Signals remain: `bookings`, `payments`, `booking_events`, `notification_outbox`, reconciliation scan.

---

## 3. Governance visibility strategy

- **Lifecycle accountability:** Append-only `booking_events`; `actor_user_id` when user-initiated, null/trigger for DB-emitted transitions — surfaced explicitly in admin timeline copy.
- **Human judgment:** `booking_operational_notes` — append-only context, never a second lifecycle store.
- **Break-glass:** Documented in UI; server-verified token; monitoring events on use (`staff.lifecycle.reconciliation.break_glass_override`).
- **Escalation:** Assistance and digest remain recommendation-only; ownership stays with dispatcher/support roles.

---

## 4. Enterprise-readiness roadmap

1. **Partitioning:** Region/tenant columns on `bookings` when needed — filter queues only; same lifecycle emitter.
2. **Multi-team dispatch:** Shard views and RBAC, not duplicate emitters (see Stage 16 scaling copy).
3. **Reporting:** Export snapshots from existing loaders; join bookings ↔ booking_events ↔ payments for audit packs.
4. **Compliance:** Define retention with legal/finance; use backups/warehouse — avoid silent app-wide deletes.

---

## 5. Operational accountability strategy

| Mechanism | Purpose |
|-----------|---------|
| `booking_events` | Immutable ordering of lifecycle facts |
| `actor_user_id` | Tie events to users when present |
| Operational notes | Explain dispatch decisions |
| Reconciliation gate | Blocks unsafe transitions unless healing/break-glass |
| Row version | Optimistic concurrency — conflict is visible, not silent |

---

## 6. Maintainability and hardening strategy

- Centralize recovery and governance copy under `lib/operational/reliability/`.
- Keep server-only boundaries: monitoring reads, dispatch-outbox, webhook orchestration stay server-only modules.
- Prefer shared query modules (`monitoring-reads`, `snapshot`) over one-off SQL in components.
- UI components consume typed snapshots only.

---

## 7. Compliance-readiness foundations

- **Record classes:** See `OPERATIONAL_RECORD_CLASSES` in `compliance-foundations.ts`.
- **Export:** `AUDIT_EXPORT_READINESS_COPY` — joins on IDs; provider raw payloads from Paystack + logs.
- **Retention:** `DATA_RETENTION_HOOKS_COPY` — policy owned outside application code.

---

## 8. Recovery and reliability improvements (concrete)

1. Outbox **pending / processing / stale lease** counts for queue health.
2. **Failed outbox sample** with booking deep links and `last_error`.
3. **Stale lease sample** to validate worker reclaim behavior.
4. Paystack webhook **retry semantics** documented (503 vs 401/400).
5. **Transition failure hints** mapped from action codes (concurrency, reconciliation, lifecycle).

---

## 9. Operational consistency audit plan

| Review | Cadence | Owner |
|--------|---------|--------|
| Queue threshold alignment (monitoring vs dispatcher strip) | On threshold change | Eng |
| Lifecycle labels vs `booking_event_type` enum | On migration | Eng |
| Recovery playbook vs actual routes/env | Quarterly | Ops + Eng |
| Monitoring vs analytics counts (same predicates) | When editing either | Eng |
| Customer vs workforce vs admin wording | UX pass | Product |

---

## 10. Phased implementation order (priority stack)

1. **Reliability** — monitoring extensions, playbook, taxonomy (done).
2. **Governance clarity** — accountability copy, actor visibility (done).
3. **Operational accountability** — timeline actor field, transition hints (done).
4. **Maintainability** — reliability module layout, command-bar fix (done).
5. **Enterprise readiness** — documentation hooks and export backlog (hooks done).
6. **Long-term durability** — warehouse exports, external alerting on lease/outbox metrics (backlog).

---

## Code map

| Piece | Path |
|-------|------|
| Failure taxonomy & playbook | `lib/operational/reliability/*` |
| Monitoring snapshot extensions | `lib/operational/monitoring-reads.ts` |
| Monitoring UI | `app/(dashboard)/admin/monitoring/page.tsx` |
| Transition hints | `lib/operational/reliability/lifecycle-transition-recovery-hints.ts`, `booking-ops-form.tsx` |
| Governance card | `app/(dashboard)/admin/operations/[bookingId]/page.tsx` |
| Timeline actor | `components/operations/workforce-activity-timeline.tsx`, `lib/admin/operations/queries.ts` |
