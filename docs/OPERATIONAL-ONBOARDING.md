# Operational onboarding (dispatcher & support)

Practical entry paths — **no bureaucracy**. Authorization remains JWT role (`dispatcher` minimum for admin surfaces below).

## First-day navigation

1. **Operations** (`/admin/operations`) — boards, queues, booking drill-down, lifecycle transitions (centralized updater).
2. **Monitoring** (`/admin/monitoring`) — reconciliation samples, stuck lists, outbox recovery, recovery playbook.
3. **Analytics** (`/admin/analytics`) — KPIs, strategic interpretive summary, exports (`/api/admin/export/*`).
4. **Digest** (`/admin/operations/digest`) — daily workload line + merged hints.
5. **Support hub** (`/admin/support`) — links into playbooks and cross-surfaces.

On **Analytics**, use the Learning (Stage 19) and **Stewardship** (Stage 20) cards for interpretive context — they do not replace Monitoring lists or lifecycle actions.

Shared hub navigation appears at the top of each dispatcher surface (Stage 18).

## Stewardship and continuity

- Governance rationale and architectural guardrails are summarized on the Analytics stewardship card and in `docs/stage-20-production-stewardship.md`.
- Institutional memory stays in **docs**, **exports**, and **deployment notes** — not in ad hoc DB columns that duplicate bookings truth.
- Rotate operators through the same hub order (Operations → Monitoring → Analytics → Support) so judgment stays consistent across personnel changes.

## Truth hierarchy

- **Bookings row** — current lifecycle status.
- **booking_events** — append-only audit stream (actor may be null for trigger-owned emits).
- **Payments** — checkout attempts; reconcile before unrelated transitions.
- **notification_outbox** — email side-effects only.

## When something breaks

1. Open **Monitoring** → reliability overview + playbook.
2. Open the **booking** in Operations → assistance cards + internal notes.
3. Escalation remains **human-led** — assistance does not auto-transition lifecycle.

## Deeper documentation

| Topic | Doc |
|-------|-----|
| Assistance boundaries | `docs/stage-15d-operational-assistance.md` |
| Governance & reliability | `docs/stage-16-2-platform-governance.md` |
| Optimization & exports | `docs/stage-17-platform-optimization.md` |
| Consolidation & durability | `docs/stage-18-ecosystem-consolidation.md` |
| Scale governance & evolution | `docs/stage-19-operational-scale-governance.md` |
| Production stewardship & longevity | `docs/stage-20-production-stewardship.md` |
| Deploy & cron | `DEPLOYMENT.md` |
