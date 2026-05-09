# Stage 16 — Business Scaling, Ecosystem Expansion & Operational Intelligence Maturity

This document consolidates the **ten requested deliverables** for evolving Shalean from an operationally mature platform into a **scalable operational business ecosystem**, without duplicating operational truth or bypassing centralized lifecycle governance.

---

## 1. Implementation plan

**Principles (non-negotiable)**

- Single lifecycle authority; `booking_events` remain append-only operational truth.
- All new surfaces are **read-only derivations** from `bookings`, `payments`, `booking_events`, dispatcher queues, `notification_outbox`, and reconciliation scans.
- No autonomous lifecycle transitions, no unsafe recurring automation, no fake predictive AI store.
- RLS, optimistic concurrency, dispatcher authority, and notification architecture stay intact.

**Workstreams**

| Workstream | Scope | Shipped in this iteration |
|------------|--------|---------------------------|
| Customer retention | Dashboard and post-completion trust UX | Per-customer retention insights; completed-visit reinforcement card |
| Workforce ecosystem | Cleaner-facing operational transparency | Operational snapshot on My jobs (30d window + all-time completions) |
| Operational intelligence | Dispatcher analytics | Org repeat-completion sample; capacity pressure counts; business health strip; scaling readiness copy |
| Regional / service expansion | Guardrails and terminology | `lib/operational/scaling-readiness.ts` copy modules |
| Executive visibility | Leadership-readable grouping | New sections on `/admin/analytics` with in-page anchors |
| Ecosystem polish | Consistent vocabulary | Calm, “informational only” microcopy on new cards |

**Follow-up backlog (ordered)**

1. Customer: optional “last service notes as rebook defaults” (reuse existing rebook URL — already copies address/price).
2. Workforce: read-only onboarding checklist page (static + links to ops policy — no duplicate HR system).
3. Intelligence: scheduled rollup job (warehouse) when row scans exceed limits — **not** a second analytics DB in Postgres.
4. Regions: add nullable `operational_region` on `bookings` when product is ready; queue filters only — lifecycle unchanged.
5. Executive: export CSV of snapshot (same queries) if leaders need offline review.

---

## 2. Customer retention roadmap

| Horizon | Outcome | Mechanism |
|---------|---------|------------|
| Now | Relationship visibility without spam | `loadCustomerRetentionInsights` from `bookings`; dashboard card; inactive hint only when no upcoming pipeline visit |
| Next | Post-service continuity | Completed booking trust card; existing rebook + Paystack flows unchanged |
| Later | Cadence-aware prompts (still opt-in) | Use same insights to **suggest** timing in UI only; notifications only via existing outbox triggers |
| Future | Recurring services | Schema for templates + explicit customer confirmation each cycle; workforce capacity view — **no** silent auto-booking |

**KPIs to watch (read-only):** repeat completion share (org), median days between completions (per customer sample), draft→paid rate.

---

## 3. Workforce ecosystem roadmap

| Horizon | Outcome | Mechanism |
|---------|---------|------------|
| Now | Transparency and calm | Cleaner operational snapshot (completions/cancellations/completion share in 30d) |
| Next | Quality conversations | Dispatcher already has leaderboard; extend with **trend** charts fed by same tables (bounded samples) |
| Onboarding | Readiness without duplicate systems | Single “Cleaner readiness” doc page + checklist; role-gated links from My jobs |
| Coordination | Dispatcher–cleaner clarity | Continue shared lifecycle; escalation copy on job detail (existing patterns) |

**KPIs:** completion share (window), cancellation counts (window), assignment delay from `booking_events`.

---

## 4. Operational intelligence maturity strategy

- **Trend layer:** keep daily head-query trends (bookings created, `PAYMENT_RECEIVED` events) as today.
- **Pressure layer:** surface assignment and field pipeline counts alongside ops health (implemented).
- **Retention layer (org):** bounded repeat-completion sample (implemented).
- **Assistance layer:** digest and assistance remain **recommendation-only**; no new automation.

**Explicit non-goals:** separate “AI ops” database, customer-level PII in analytics aggregates without RLS context.

---

## 5. Forecasting and capacity readiness strategy

- **Inputs (already available):** scheduled starts, completions, queue depths, payment outcomes, outbox failures.
- **Hooks:** document-driven (`FORECASTING_HOOKS_COPY`) + optional future **materialized views** or warehouse jobs computing rolling averages — still **derived**, never authoritative over `bookings`.
- **Capacity:** `needs_assignment` vs `active_field_pipeline` as assignment pressure; utilization ratio as workforce pressure.
- **No fake forecasts:** any “expected load” UI must label confidence and data window; store projections only outside operational truth (e.g. BI tool), not as booking state.

---

## 6. Regional scaling readiness plan

1. **Model:** `bookings.operational_region` (nullable) + dispatcher RLS/scopes filtering queues — lifecycle functions unchanged.
2. **Workforce:** filter “My jobs” by region assignment when multi-region launches; same `cleaner_id` on `bookings`.
3. **Support:** support hub filters by region metadata on bookings (read-only).
4. **Governance:** one reconciliation and one outbox; regionalization is **partitioning of views and RBAC**, not new emitters.

Copy reference: `OPERATIONAL_REGION_COPY`, `MULTI_TEAM_DISPATCH_COPY` in `lib/operational/scaling-readiness.ts`.

---

## 7. Executive visibility strategy

- **Single pane:** `/admin/analytics` with anchors `#stage16-business-health`, `#stage16-capacity`, `#stage16-retention-org`, `#stage16-scaling`.
- **No hidden state:** every metric traceable to existing tables and documented caveats (`data_gaps`).
- **Cadence:** leadership reviews same page as operations; optional weekly email later = **render of snapshot**, not new metrics.

---

## 8. Operational health framework

| Layer | Signals |
|-------|---------|
| Customer health | Payment completion, reconciliation hints, timeline consistency |
| Pipeline health | Draft→paid, assignment delay, stuck queues |
| Workforce health | Utilization, completions vs cancellations (window) |
| Platform health | Outbox failures, recon divergence, payment failure rate |

**Health = composite of the above** — heuristic “traffic light” can be added later using thresholds in code (still derived).

---

## 9. Ecosystem maturity improvements

- Standard phrasing: “informational”, “derived from your bookings”, “no parallel lifecycle store”, “governed lifecycle”.
- Visual tone: muted cards, small mono numerics, emerald for positive completion states.
- Navigation: deep links from analytics to Operations queues (existing `adminOperationsHref`).

---

## 10. Phased implementation order (priority stack)

1. **Customer retention** — dashboard insights + post-completion trust (done).
2. **Workforce maturity** — cleaner operational snapshot (done); onboarding page next.
3. **Operational scalability** — capacity pressure + org retention sample on analytics (done).
4. **Business visibility** — business health strip on analytics (done).
5. **Forecasting readiness** — documentation + future warehouse rollups (hooks documented).
6. **Ecosystem polish** — terminology pass on older pages (incremental); regional column when product approves.

---

## Code map (this stage)

| Area | Location |
|------|-----------|
| Customer retention insights | `lib/bookings/customer-flow/retention-insights.ts`, `components/dashboard/customer-retention-insights.tsx` |
| Dashboard integration | `components/dashboard/customer-dashboard-hub.tsx` |
| Cleaner profile summary | `lib/cleaner/operations/profile-summary.ts`, `app/(dashboard)/cleaner/jobs/page.tsx` |
| Analytics extensions | `lib/analytics/types.ts`, `lib/analytics/snapshot.ts`, `app/(dashboard)/admin/analytics/page.tsx` |
| Scaling guardrail copy | `lib/operational/scaling-readiness.ts` |
| Digest workload line | `lib/operational/assistance/digest.ts` |
| Completed visit trust | `app/(dashboard)/bookings/[bookingId]/page.tsx` |
