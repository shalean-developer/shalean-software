# Stage 15D — Operational Automation Readiness & Intelligent Assistance

Operational maturity phase for **shalean-software**: assistance, prioritization, workflow acceleration, proactive surfacing, support intelligence, and automation **readiness** — without autonomous lifecycle control.

---

## 1. Implementation plan

| Track | Scope | Status (this PR) |
| --- | --- | --- |
| Assistance core | Pure derivation from bookings / payments / booking_events / queue counts | Shipped: `lib/operational/assistance/*` |
| Dispatcher UX | Queue hints + command bar + recent visits | Shipped |
| Booking UX | Context assistance card on detail | Shipped |
| Digest | Read-only daily snapshot from analytics + queues | Shipped: `/admin/operations/digest` |
| Support hub | Copy + links into assistance surfaces | Shipped |
| Automation boundaries | Documented constants + digest panel | Shipped: `boundaries.ts` + digest UI |
| Future | Historical backlog trends, cleaner overlap queries, saved filters sync | Not in scope (no new metrics DB) |

**Principles:** No new operational truth store; hints reuse existing queries and analytics snapshot; mutations unchanged.

---

## 2. Intelligent assistance roadmap

1. **Now:** Rule-based hints (thresholds aligned with `OPS_THRESHOLDS` / analytics SLA surfaces).
2. **Next:** Optional ranking scores per queue row (still display-only), powered by same tables.
3. **Later:** Approval-gated action proposals (UI checklist → existing server actions only).
4. **Never (constitution):** Auto-dispatch, auto status transitions, AI-controlled operations.

---

## 3. Operational recommendation strategy

- **Sources:** `booking_events`, `payments`, `bookings`, dispatcher queue counts, analytics snapshot.
- **Categories:** `payment`, `assignment`, `customer`, `recovery`, `workload`.
- **Severity language:** Calm — “Review soon”, “Heads-up”, “Context” (mapped from internal `priority` / `attention` / `info`).
- **Conflict handling:** Reconciliation divergence and repeated payment failures surface before generic aging hints where applicable.

Code: `deriveBookingOperationalAssistance`, `deriveQueueOperationalHints`, `loadOperationalDigest`.

---

## 4. Workflow acceleration improvements

| Feature | Behavior |
| --- | --- |
| Jump to booking | UUID validation → `/admin/operations/[id]` |
| Recent bookings | `localStorage` (`shalean_ops_recent_bookings_v1`), max 8 |
| Quick links | Digest, needs-cleaner preset, Monitoring |
| Nav cross-links | Operations layout → digest, support, analytics |

Files: `components/admin/operations-command-bar.tsx`, `operations-recent-visits.tsx`, `app/(dashboard)/admin/operations/layout.tsx`.

---

## 5. Proactive surfacing strategy

- **Early risk:** Stuck awaiting payment, assigned stall, in-progress staleness — echoed in digest “Queue health”.
- **Anomalies:** SLA surfaces + payment failure rate shape — digest “Incidents & anomalies”.
- **Digest cadence:** On-demand page load (no cron); same data as Monitoring/Analytics family.

---

## 6. Support intelligence improvements

- Support hub card explains digest, booking assistance, and browser-local continuity.
- Recovery playbooks unchanged; assistance layer **points** to reconciliation and monitoring rather than duplicating procedures.
- Incident clustering is descriptive (multiple signals in one digest), not a separate incident system.

---

## 7. Automation-readiness architecture

- **Pattern:** `RECOMMENDATION_APPROVAL_PATTERN` in `lib/operational/assistance/boundaries.ts`.
- **Trigger taxonomy:** `OPERATIONAL_TRIGGER_CATEGORIES` for future event routing labels (hooks only).
- **Human gate:** All mutations remain existing server actions / centralized updater.

---

## 8. Operational safety boundaries

Captured in `OPERATIONAL_AUTOMATION_BOUNDARIES`:

- **Future automatable (with approval):** e.g. capped retries, digest email, ranked suggestions.
- **Human-controlled:** lifecycle transitions, assignment decisions, reconciliation break-glass narrative.
- **Lifecycle / financial safety:** row_version, append-only events, no autonomous money movement.

Also rendered on `/admin/operations/digest` for operator visibility.

---

## 9. Responsive operational UX improvements

- Compact hint density on dispatcher strip; default density on booking detail.
- Touch-friendly queue chips preserved; command bar stacks on small screens.
- Assistance footnote on every hint list: informational-only disclaimer.

---

## 10. Phased implementation order (recommended follow-through)

| Phase | Focus |
| --- | --- |
| **15D.1** (done) | Hint derivation, strip + booking cards, digest, command bar, docs |
| **15D.2** | Row-level hint badges on `BookingsTable` (derive from row columns only) |
| **15D.3** | Monitoring drill-through links carrying queue context in query params |
| **15D.4** | Optional email digest job (read-only template; human subscribe) |
| **15D.5** | Approval UX prototype for “suggested action” tied to a single server action |

---

## File map

- `lib/operational/assistance/types.ts` — hint model  
- `lib/operational/assistance/booking-assistance.ts` — booking-level hints  
- `lib/operational/assistance/queue-assistance.ts` — board-level hints  
- `lib/operational/assistance/digest.ts` — digest loader (server-only)  
- `lib/operational/assistance/boundaries.ts` — automation readiness constants  
- `components/admin/operational-hints-list.tsx` — presentation  
- `components/admin/operations-command-bar.tsx` — jump + shortcuts  
- `components/admin/operations-recent-visits.tsx` — local continuity  
- `app/(dashboard)/admin/operations/digest/page.tsx` — digest page  
