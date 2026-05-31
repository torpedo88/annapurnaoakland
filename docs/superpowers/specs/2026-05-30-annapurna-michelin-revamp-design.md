# Annapurna Oakland — Michelin Dark-Luxe Revamp + DoorDash Drive Ordering

**Date:** 2026-05-30
**Status:** Approved (visual direction); Phase 1 ready for planning
**Author:** brainstorming session

## Problem

The current site reads as a generic, warm/rustic "family kitchen" template. The owner
wants a Michelin-grade fine-dining presence with online ordering. Ordering should be
handled by the restaurant's own system, with **DoorDash Drive** dispatching the delivery
driver. The restaurant also offers **pickup** (no driver needed).

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Visual direction | **Dark fine-dining luxe** (near-black + Michelin gold) |
| Typography | **Jost** (geometric sans, light/wide caps) + **Inter** body. No newspaper/Didone serifs. Remove Instrument Serif + Caveat. |
| Fulfillment | **Pickup** (our system) + **Delivery** (DoorDash Drive, driver-only) |
| Ordering model | Customer places full order in our system; backend later calls DoorDash Drive to dispatch a driver. DoorDash does **not** collect payment. |
| Bento drag-gallery hero | **Retired** from homepage (too playful). Component file left in repo, unused. |
| Sequencing | Phase 1 (visual revamp) build now. Phase 2 (Stripe ordering) + Phase 3 (Drive) specced now, built when credentials exist. |

## Hard dependencies (block Phases 2–3, not Phase 1)

- **DoorDash Drive** business agreement + credentials: `developer_id`, `key_id`,
  `signing_secret`. (Note: `order.online/store/80181` is the consumer *Marketplace*
  storefront — a different product from Drive. It is not used by this model.)
- **Payment provider** (Stripe assumed): Drive does not collect money, so we must.
- Pickup also currently has no real backend — `/checkout` is demo mode today.

---

## Phase 1 — Visual Revamp (build now)

Pure frontend. No external dependencies. Ships independently.

### Design tokens (`src/app/globals.css` `@theme` + `src/app/layout.tsx`)

Replace the terracotta light theme with an always-dark luxe palette:

| Token | Value | Use |
|---|---|---|
| `--color-background` | `#14100D` | page (espresso near-black) |
| `--color-surface` | `#1C1712` | cards, raised sections |
| `--color-foreground` | `#F3E9D6` | primary text (cream) |
| `--color-muted` | `#8A8276` | secondary text |
| `--color-accent` / gold | `#C9A24B` | primary accent, CTAs, hairlines, active state |
| `--color-line` | `rgba(201,162,75,0.15)` | hairline borders/dividers |
| `--color-ember` | `#B9742F` | sparing warm secondary (hover) |

- `layout.tsx`: swap `Instrument_Serif`/`Manrope`/`Caveat` → `Jost` (`--font-display`,
  weights 200/300/400/500) + `Inter` (`--font-body`). Update `<body>` inline bg to
  `#14100D`, color `#F3E9D6`, `fontFamily: var(--font-body)`.
- Display headings: Jost, weight 200–300, `letter-spacing` ~`.14em`, uppercase for
  wordmark/eyebrows; sentence-case for statements. Body: Inter 300–400, line-height 1.7.

### Motion

- Slow, restrained: 300–500ms ease-out fades and small (≤12px) translateY reveals on
  scroll. Subtle, 1–2 elements per view.
- `prefers-reduced-motion`: disable transforms, keep instant opacity. (Reuse the
  `useReducedMotion` pattern already added to the bento component.)

### Shared shell — `src/components/preview/terracotta/shell.tsx` + `src/components/layout/{header,footer}.tsx`

- **Header:** transparent over hero, condenses to solid `#14100D` w/ hairline on scroll.
  Jost wordmark "ANNAPURNA" (gold), minimal nav (Menu · Our Story · Order), one gold
  pill CTA "Order". Mobile: slide-in sheet, dark.
- **Footer:** dark, hairline-separated columns — hours, address (948 Clay St), contact,
  socials. Gold accents. Refined, sparse.
- Rename note: the "terracotta" naming is now a misnomer. Keep the file path to avoid a
  broad rename in this phase; treat it as the canonical shell. (A rename can be a later
  cleanup.)

### Homepage — `src/app/page.tsx`

Replace `<BentoHero />` and restyle all sections dark-luxe. Section order:

1. **Hero** — full-bleed cinematic dish, dark radial vignette. Eyebrow "Est. 2010 · A
   Himalayan Kitchen", wordmark "Annapurna" (Jost light caps), one-line tagline, dual CTA:
   **Order Pickup** (gold solid) + **Delivery** (gold outline). Top strip: city · open
   status · address.
2. **Kitchen statement** — gold rule + eyebrow + large light Jost statement + short
   refined paragraph (replaces playful "things we refuse to cut corners on" copy with
   restrained voice; keep the truthful facts).
3. **House signatures** — refined still image grid (no drag), 4 dishes from
   `src/data/menu.ts`, gold name + price captions on gradient. Uses `next/image`.
4. **The craft** — "Four things we never speed up" reframed luxe (hand-pleated momo,
   live tandoor, pressed paneer, slow-cooked) — dark cards, hairline borders.
5. **Story / family** — existing chef/story section restyled dark (no fabricated quotes;
   keep the `guestNotes`/TODO honesty guard as-is).
6. **Order band** — centered dual CTA (Pickup / Delivery).
7. **Footer** (shell).

### Menu — `src/app/menu/page.tsx` + `src/components/menu/*`

- Restyle dark-luxe: dark category tabs (gold active underline), dish cards on `#1C1712`
  with hairline borders, gold price, refined dietary badges. Keep existing data + tab/
  search logic. Search input dark-themed (fix the 390px overflow noted earlier).

### Order CTAs (Phase 1 wiring)

- **Order Pickup** → `/menu` (existing in-app flow; demo checkout stays, restyled).
- **Order Delivery** → stub: a styled button that opens a small "Delivery launching soon"
  state (no dead link, no fake success). Lit up in Phase 3.

### Checkout / Admin

- Inherit dark tokens (token-level restyle only). No flow changes this phase. Remove any
  remaining demo/roadmap disclosure text if still user-visible.

### Phase 1 acceptance

- `next build` green; `/` stays static.
- 0 console errors; LCP image carries `priority`.
- Jost + Inter load via `next/font`; no Instrument/Caveat references remain in rendered UI.
- Verified at 375 / 768 / 1024 / 1440; reduced-motion verified; AA contrast on cream-on-
  espresso and gold-on-espresso.
- Dual Order CTAs present; Delivery shows the stub state (no broken link).

---

## Phase 2 — Real Ordering Backend (spec; build when Stripe ready)

Prerequisite for Phase 3. Turns the demo cart into a real, paid order.

- **Cart:** reuse `@/lib/preview-cart` (`CartProvider` already in `layout.tsx`).
- **Order record:** persist orders (id, items, totals, fulfillment type pickup|delivery,
  customer name/phone, delivery address when delivery, status, timestamps). Storage
  decision deferred to plan (e.g., Vercel Marketplace Postgres/Neon per repo norms).
- **Payment:** Stripe. Cart → `/checkout` collects contact + (delivery) address → Stripe
  Payment Intent → on success, create order record `status=confirmed`.
- **Pickup vs delivery branch:** pickup needs no driver; delivery proceeds to Phase 3.
- **Admin:** existing `/admin` dashboard reads real orders instead of demo data.
- **Acceptance:** a card payment in test mode creates a persisted, confirmed order visible
  in admin; failures surface clear errors (no silent failure); no secrets in client.

## Phase 3 — DoorDash Drive Dispatch (spec; build when Drive creds ready)

Adds driver dispatch + tracking for delivery orders created in Phase 2.

- **Credentials:** `DOORDASH_DEVELOPER_ID`, `DOORDASH_KEY_ID`, `DOORDASH_SIGNING_SECRET`
  as server env vars (Vercel env). JWT signed per Drive auth.
- **Delivery quote:** at checkout (delivery), call Drive *quote* with pickup (restaurant)
  + dropoff address → show fee/ETA before payment.
- **Create delivery:** after payment success for a delivery order, call Drive
  *create delivery*; store `external_delivery_id` + Drive tracking URL on the order.
- **Webhooks:** `/api/doordash/webhook` updates order status (created → picked_up →
  delivered / cancelled). Verify webhook signature.
- **Customer tracking:** `/order/[id]` (route exists) shows live status + Drive tracking
  link.
- **"Order Delivery" CTA** from Phase 1 now points into this real delivery flow.
- **Acceptance:** sandbox delivery order produces a quote, dispatches a (sandbox) driver,
  receives webhook status transitions, and surfaces tracking to the customer; signature
  verification enforced; graceful failure if Drive is unavailable (order stays paid,
  flagged for manual dispatch — no silent loss).

---

## Out of scope

- Renaming the `preview/terracotta` shell directory (later cleanup).
- The consumer DoorDash Marketplace storefront link.
- Loyalty, reservations, multi-location, i18n.

## Risks / notes

- Always-dark design: verify AA contrast independently (gold `#C9A24B` on `#14100D` ≈ 6:1
  — passes for large/UI; check small text uses cream not gold).
- Drive does not collect payment — Phase 2 (Stripe) is a hard prerequisite for Phase 3.
- Keep the existing "no fabricated press/quotes" honesty guards in `page.tsx`.
