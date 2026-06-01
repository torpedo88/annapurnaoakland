# Admin Panel P2 — Live Order Management Design

**Date:** 2026-05-31
**Status:** Approved (design); spec under review
**Depends on:** P0+P1 (auth/RBAC, settings, pricing, delivery-pricing) — already merged on `feat/admin-panel-p0-p1`.
**Scope:** Connect the admin dashboard to live DB orders, add two fulfillment-specific status workflows, manual/phone order entry, and manual payment tracking. Removes the legacy `localStorage` order path.

---

## 1. Background & Problem

After P0+P1 the admin panel has real auth and DB-backed settings, but the **order dashboard still reads `localStorage`** (`src/app/admin/dashboard.tsx` via `src/lib/preview-order.ts`). Real customer orders are written to Postgres by `POST /api/orders` and are **invisible to staff**. There is also no way to create a phone/walk-in order, and no payment tracking (Stripe is deferred to P6).

**Goal:** A live, DB-backed order board staff actually run service from — see incoming orders in real time (polling), advance them through a kitchen workflow, take phone orders, and mark payment at handoff.

---

## 2. Decisions (locked in brainstorm)

1. **Separate pickup/delivery state machines** (not a unified set, not minimal).
2. **Full manual order entry** — pickup AND delivery; delivery dispatches a real DoorDash driver on create (same server-authoritative path as customer checkout).
3. **Payment tracking now**: `payment_status` (unpaid/paid/refunded) + `payment_method` (cash/card/online), manual toggle. Stripe wires into these at P6.
4. **Alerts**: sound + visual badge on new `received` orders. Sound = synthesized WebAudio beep (no bundled asset); user-toggleable.
5. **Polling** ~10s (decided in P0+P1 brainstorm); no realtime/supabase-js.

---

## 3. Stack constraints

Next 16.2.4 (App Router, `proxy` guard already covers `/admin` + `/api/admin`), React 19, Drizzle + postgres.js, Supabase project `zfnhcuvgvnflduqeiyin` (RLS on all tables). Auth helpers: `getSession()`, `requireRole(roles)` from `@/lib/auth/session`. Pricing: `priceOrder(items,{tipCents,deliveryFeeCents,taxRate})`, `getSettings()`, `computeDeliveryFee`, `assertDeliverable`. DoorDash: `quoteDelivery`, `acceptQuote` (`@/lib/doordash/client`). Vitest for unit tests.

---

## 4. Data model — migration `0004`

Add three columns to `orders`:

| column | type | default | values |
|---|---|---|---|
| `payment_status` | text NOT NULL | `'unpaid'` | `unpaid` \| `paid` \| `refunded` |
| `payment_method` | text | null | `cash` \| `card` \| `online` |
| `source` | text NOT NULL | `'online'` | `online` \| `phone` |

- Drizzle `orders` table updated to match.
- Migration applied via Supabase MCP `apply_migration` (name `0004_order_payment_source`), consistent with `0000`–`0003`. RLS already enabled on `orders`.
- `orders.status` stays a single `text` column (default already `'received'` from migration `0001`).

---

## 5. Status state machines — `src/lib/orders/status.ts` (pure, unit-tested)

```
PICKUP:   received → preparing → ready → completed
DELIVERY: received → preparing → ready → courier_picked_up → en_route → delivered
```
Both: `cancelled` reachable from any non-terminal state.
Terminal states: `completed`, `delivered`, `cancelled`.

**Actor rules:**
- `staff` actor (any logged-in role — staff/manager/owner) may advance **forward by one** along the staff-controllable prefix:
  - pickup: `received→preparing→ready→completed`
  - delivery: `received→preparing→ready` (NOT beyond — `courier_picked_up`/`en_route`/`delivered` are DoorDash-driven)
  - and may `cancel` any non-terminal order.
- `webhook` actor (DoorDash) may set delivery states `courier_picked_up`, `en_route`, `delivered`, `cancelled`, **forward-only**, never overriding a terminal state.

**Pure API:**
```ts
type Fulfillment = "pickup" | "delivery";
type Actor = "staff" | "webhook";
export const PICKUP_FLOW: string[];
export const DELIVERY_FLOW: string[];
export const TERMINAL: Set<string>;
export function nextStatuses(fulfillment: Fulfillment, current: string): string[]; // staff-advanceable next states (+ "cancelled")
export function canTransition(fulfillment: Fulfillment, from: string, to: string, actor: Actor): boolean;
```
`nextStatuses` powers the dashboard's per-card buttons. `canTransition` guards the PATCH API and the webhook update.

---

## 6. DoorDash webhook expansion — `src/lib/doordash/webhook.ts` + route

Current mapping only handles `delivered→completed` and `cancelled→cancelled`. Expand the DoorDash `delivery_status` → order-status mapping:

| DoorDash delivery_status | order status |
|---|---|
| `enroute_to_pickup`, `arrived_at_pickup`, `picked_up` | `courier_picked_up` |
| `enroute_to_dropoff`, `arrived_at_dropoff` | `en_route` |
| `delivered` | `delivered` |
| `cancelled` | `cancelled` |
| (others) | ignored (no status change) |

The webhook route applies the new status only if `canTransition(delivery, current, mapped, "webhook")` is true (forward-only, terminal-safe). Existing idempotency (`deliveries.lastEventId`) and HMAC signature verification are unchanged. Exact DoorDash status strings are verified against `src/lib/doordash/types.ts` / existing webhook code during implementation.

---

## 7. Order APIs — all under `/api/admin/*` (proxy-guarded + `requireRole`)

- **`GET /api/admin/orders?lane=active|completed|cancelled`** — returns orders for the lane (newest first, capped at 200), joined with their `deliveries` row (status, trackingUrl) when present. Any logged-in role.
- **`PATCH /api/admin/orders/[id]`** `{ status }` — load order, `canTransition(fulfillment, current, status, "staff")` else 403/409; update `status` + `updatedAt`. Any logged-in role.
- **`PATCH /api/admin/orders/[id]/payment`** `{ payment_status, payment_method }` — validate enums; update. Any logged-in role.
- **`POST /api/admin/orders`** — manual order. Body: `items:[{id,qty}]`, contact, `fulfillment`, `address?`, `tip?`, optional `payment_status`/`payment_method`. Reuses `getSettings()` + `priceOrder` (server tax) and, for delivery, `quoteDelivery → acceptQuote → computeDeliveryFee` then writes the `deliveries` row — identical authoritative path to `POST /api/orders`. Sets `source='phone'`. Honors `ordering_paused`/availability like the public route. Returns `{ orderId }`. Any logged-in role.

To avoid duplicating the customer order path, the shared dispatch+persist logic in `POST /api/orders` is extracted into a reusable function (e.g. `placeOrder(input)` in `src/lib/orders/create-order.ts` or a new `src/lib/orders/place-order.ts`) that both the public route and the admin manual route call. This is a targeted refactor of existing code, not new behavior.

---

## 8. Dashboard rebuild — `src/app/admin/(panel)/page.tsx` + `src/components/admin/*`

- **Remove** the `localStorage` path: `src/lib/preview-order.ts` is no longer used by the dashboard (delete it if nothing else imports it; otherwise leave and stop importing).
- Client component polls `GET /api/admin/orders` for the active lane every ~10s (and on tab focus). Lanes: **Active** (`received`,`preparing`,`ready`,`courier_picked_up`,`en_route`), **Completed** (`completed`,`delivered`), **Cancelled**.
- Order card: order #, source badge (online/phone), fulfillment, contact, line items, subtotal/tax/tip/delivery/total, payment badge + paid/method toggle, DoorDash tracking link (delivery), timestamp.
- Action buttons from `nextStatuses(fulfillment, status)`; a Cancel action; paid/unpaid + method control.
- **Alerts**: track seen order ids across polls; when a new `received` order appears, increment a badge and play a short WebAudio beep. Sound on/off toggle persisted in `localStorage` (`annapurna:admin:sound`).
- **New manual order**: a button opening a form (item picker from the DB menu or static catalog, qty steppers, contact fields, pickup/delivery toggle; delivery fetches a live quote via the existing `/api/delivery/quote` then submits to `POST /api/admin/orders`). Reuses server-authoritative pricing.

Files kept focused: `orders-board.tsx` (lanes+polling+alerts), `order-card.tsx` (single card + actions), `manual-order-form.tsx` (creation). The server `page.tsx` renders the board.

---

## 9. Testing

- **Unit (`status.test.ts`)**: full transition matrix — valid forward steps per fulfillment; invalid backward/skip; staff blocked from delivery courier states; webhook forward-only + terminal-safe; cancel rules.
- **Unit (webhook mapping)**: each DoorDash `delivery_status` maps to the expected order status; unknown → ignored.
- **Manual/integration**: place an online order → it appears in Active; advance pickup received→preparing→ready→completed; create a manual pickup order (source=phone); toggle paid+method; create a manual delivery order (with DoorDash creds or a stubbed quote) ; verify `ordering_paused` blocks both public and manual creation; alert fires + badge increments on a new received order.

---

## 10. Risks / notes

- **Shared order path refactor** (extracting `placeOrder`) touches the working `POST /api/orders`. Must keep its behavior byte-for-byte for the customer flow (same validation, dispatch, response). Covered by re-testing the public route.
- **Manual delivery dispatches a real driver immediately** on create (per decision) — staff must understand "create delivery order" books DoorDash. The form will confirm before dispatch.
- DoorDash `delivery_status` exact strings must be confirmed against existing code/types during implementation; unknown statuses are safely ignored.
- WebAudio beep requires a user gesture to unlock audio in some browsers; first interaction with the dashboard (e.g. the sound toggle) initializes the AudioContext.
- Polling every 10s for a single restaurant is well within Supabase limits; the GET is capped at 200 rows per lane.

---

## 11. Out of scope (later phases)

P3 menu CRUD, P4 hours/reservations/catering, P5 promos, P6 Stripe payments + refunds (which will set `payment_status` automatically and enable refund actions on top of the columns added here).
