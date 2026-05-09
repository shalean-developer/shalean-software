# Booking prototype — Phase 1B.4 QA, friction review & backend-integration guardrails

Frontend-only scope (`/prototype/booking`). No lifecycle or payment wiring.

---

## 1. Real-device QA — fixes applied in code

| Topic | Change |
|--------|--------|
| **Keyboard + sticky footer** | `PrototypeScrollEnvironment` sets `scroll-padding-bottom` / `scroll-padding-top` on `<html>` while the prototype layout is mounted so focused inputs can scroll clear of the fixed summary (iOS Safari, Android Chrome). |
| **Safe areas** | Header uses `padding-top: env(safe-area-inset-top)` via `bp.header`; sticky footer keeps `padding-bottom: max(1.25rem, env(safe-area-inset-bottom))`. |
| **Horizontal jitter** | `bp.pageRoot` includes `overflow-x-clip`. |
| **Step transitions** | `useLayoutEffect` scrolls to top on `draft.step` change and when `finished` becomes true — avoids mid-scroll confusion after keyboard/tall steps. |
| **Content vs footer** | Main column bottom padding increased to `pb-[calc(9.25rem+env(safe-area-inset-bottom))]` on small screens. |
| **Touch polish** | Mobile sticky bar uses `-webkit-tap-highlight-color: transparent` and `isolate` for stacking. |
| **Tablet / desktop** | Aside uses `self-start` so the rail stays aligned when the left column is very tall. |

---

## 2. Manual QA checklist (human, on hardware)

Run through once per target: **iPhone Safari**, **Android Chrome**, **small phone**, **notched phone**, **tablet portrait**, **desktop**.

1. **Sticky footer** — Never permanently covers the primary field; with keyboard open, focused input remains usable (scroll if needed).
2. **Step advance/back** — View returns to top; no clipped hero or progress.
3. **Date / suburb controls** — Native pickers open without horizontal scroll or trapped focus.
4. **Review inputs** — `enterKeyHint` shows sensible actions (next / done); no accidental zoom on iOS (inputs stay ≥16px where possible).
5. **Checkout checkbox** — Large enough tap target; label toggles reliably.
6. **Landscape** — Header + footer still readable; no overflow-x scroll.
7. **Reduced motion** — Step content animation respects `motion-reduce`; scroll jumps remain instant (no dependency on smooth scroll).

---

## 3. Friction testing — residual watch points

| Moment | Risk | Mitigation already / optional later |
|--------|------|-------------------------------------|
| Step 1–2 | Native `date` UX varies by OS | Accept OS variance; later optional slot picker component. |
| Step 4 | Three fields + keyboard | Scroll padding + hints; later autosave draft for peace of mind. |
| Step 5 | Checkbox + CTA below fold | Hint copy points “above”; keep footer estimate compact. |

---

## 4. Conversion validation — design intent

- **Pricing:** Server must eventually own totals; keep **“Estimated visit total”**, breakdown (visit / extras), and **`ESTIMATE_REASSURANCE`** string stable for trust.
- **Checkout:** Calm checklist + lock row + checkbox wording — preserve hierarchy when wiring Paystack.
- **Disabled CTA:** `prototypeProceedBlockedHint` lines are part of conversion UX — keep short and human when mapping errors from APIs.

---

## 5. Backend-integration protection strategy (UX contracts)

### 5.1 Stable UI contracts

1. **Five steps** — Where/when → Home → Customize → Review → Checkout; do not reorder without another UX pass.
2. **`visual-system.ts` (`bp.*`)** — Ring-first surfaces, radii ~`1.35rem`, sticky rail/mobile split — treat as canonical layout tokens for customer booking surfaces.
3. **Sticky summary** — Desktop rail + mobile fixed footer; primary action duplicate must remain reachable one-handed on mobile.
4. **Progress + hero copy** — `BookingPrototypeShell` structure (step meta, segmented progress, title/subtitle/reassurance).

### 5.2 Copy to freeze or evolve only deliberately

- `STEP_COPY` titles/subtitles/reassurances in `booking-prototype-flow.tsx`.
- `ESTIMATE_REASSURANCE` and `quote.totalLabel` in `mock-pricing.ts` (replace mock with server payload but **same slots**).
- Sticky `STEP_CTA` labels + reassurance lines in `prototype-sticky-summary.tsx`.
- Checkout “After you pay” bullets and lock/support tone in `step-checkout.tsx`.

### 5.3 Hierarchy patterns not to break

- Review page: **visit facts** first, **estimate well** second, **contact** third, **micro-trust** strip last.
- Estimate block: large **tabular total**, small **overline**, short reassurance paragraph.

### 5.4 Emotional / trust patterns

- No operational jargon on customer surfaces (already avoided in prototype).
- Trust signals use **quiet wells** (ring + muted fill), not badge walls.

### 5.5 Mobile patterns to preserve after integration

- `PrototypeScrollEnvironment` behavior (or equivalent global scroll-padding when sticky footer exists).
- Minimum touch heights (~48px) on primary and chips.
- Safe-area padding on header and footer.

### 5.6 Interaction patterns

- Forward navigation primary lives in **sticky summary** on mobile (not only inline).
- `blockedHint` under disabled primary — preserve when mapping validation errors (friendly strings, not codes).

### 5.7 Suggested integration order (when allowed)

1. Persist draft per step → keep optimistic UI identical.
2. Replace `computeMockQuote` output with API payload → **same shape**: `subtotalZar`, `extrasZar`, `totalZar`, labels.
3. Swap prototype checkout checkbox action for Paystack init → **keep** surrounding trust UI.
4. E2E test on **real devices** after first backend hook-up.

---

## 6. Pre-backend readiness sign-off (prototype-only)

- **UX confidence:** High for progressive disclosure and review/checkout hierarchy.
- **Friction:** Addressed for scroll/safe-area/step reset; OS-native date remains the main variance.
- **Production readiness:** Prototype is **UX-ready for pilot users**; production hardening requires backend, analytics, and payment error paths.
