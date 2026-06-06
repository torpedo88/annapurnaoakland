# Stripe Payments (P6) — Design Spec

**Date:** 2026-06-05
**Status:** Approved (pending spec review)
**Depends on:** existing ordering pipeline (`ARCHITECTURE.md` §6), DoorDash Drive (`docs/DOORDASH.md`)

## Goal

Take card payment online for **every** customer order — pickup and delivery —
before the order is dispatched. Replace the current "Demo mode — no card
required" checkout with Stripe **Embedded Checkout**. Add refunds (with delivery
cancellation) to the admin orders board.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Payment requirement | Card online for **both** pickup and delivery. Every online order is prepaid. |
| Integration | **Stripe Embedded Checkout** (Stripe-hosted form, embedded on `/checkout`, no redirect). Includes Apple/Google Pay. |
| Dispatch timing | **Charge first, then dispatch.** Driver dispatched only on Stripe-webhook-confirmed payment. |
| Manual/phone admin orders | **Unchanged** — staff create them with immediate dispatch and set payment manually (cash/card/online). They do not go through Stripe. |
| Refunds | Owner/manager refund from the orders board. Refund the card; if a delivery isn't picked up yet, cancel the DoorDash driver too. |
| Mode | Test keys first (sandbox), then live. |

## Architecture

### Order lifecycle change

Add a pre-state **`pending_payment`** before `received`:

```
pending_payment ──(Stripe payment confirmed)──▶ received ──▶ … (existing flow)
       └──────────(payment failed / abandoned)──▶ stays pending_payment (never dispatched)
```

- `pending_payment` orders are **excluded from the active orders board** (board
  shows `received`+). They carry no dispatched driver.
- Abandoned-payment orders sit harmlessly in `pending_payment`. A cleanup sweep
  (manual for v1; cron later) can prune ones older than ~1 hour. **Not** in
  scope for v1 beyond documenting it.

### `placeOrder` refactor

Split today's `placeOrder` (`src/lib/orders/place-order.ts`) into reusable
pieces so both flows share validation, pricing, and dispatch:

- **`createOrderRecord(input, { status })`** — settings gate, `validateContact`,
  `priceOrder`, 86-availability check, persist the order + items via
  `createOrder`. No dispatch. Returns `{ orderId, accessToken }`.
- **`dispatchDelivery(orderId)`** — for a delivery order: `acceptQuote` using the
  stored `externalDeliveryId`; if the quote is expired, **re-quote** from the
  order's stored dropoff address/phone/items, then accept; insert the
  `deliveries` row. Idempotent (skip if a `deliveries` row already exists).
- **`placeOrder(input)`** (manual/admin path, behavior preserved) =
  `createOrderRecord(status: "received")` + `dispatchDelivery`.

Online flow uses `createOrderRecord(status: "pending_payment")` at session
creation, and `markPaid + dispatchDelivery` from the Stripe webhook.

### Online payment flow

```mermaid
sequenceDiagram
  participant C as /checkout (client)
  participant S as POST /api/checkout/session
  participant DB as Postgres
  participant ST as Stripe
  participant W as POST /api/stripe/webhook

  Note over C: delivery → already fetched DoorDash quote (externalDeliveryId, fee)
  C->>S: { items, fulfillment, contact, address, tip, externalDeliveryId }
  S->>S: validate + priceOrder + 86 check → authoritative total (cents)
  S->>DB: createOrderRecord(status="pending_payment")  → orderId, accessToken
  S->>ST: checkout.sessions.create(ui_mode=embedded, mode=payment,\n line_items=$total, metadata.orderId, return_url=/order/{id}?t={token})
  ST-->>S: { client_secret }
  S-->>C: { clientSecret, orderId }
  C->>ST: EmbeddedCheckout renders form; customer pays
  ST->>W: checkout.session.completed (signed)
  W->>W: verify signature; load order by metadata.orderId; idempotent
  W->>DB: paymentStatus=paid, stripePaymentIntentId, stripeCheckoutSessionId,\n status pending_payment→received
  W->>W: dispatchDelivery(orderId)  (delivery only; re-quote if expired)
  C->>C: on complete → return_url → /order/[id]?t=token (confirmation + tracking)
```

**Amount integrity:** the Stripe session amount is the server-recomputed order
total (cents). The client never sends an amount. We pass **one** line item
("Annapurna order #N") priced at the computed total — the order total already
folds in subtotal, tax, delivery fee, and tip, so a single line avoids
reconciling those in Stripe. It must equal the persisted `orders.total`.

### Refund flow (admin)

`POST /api/admin/orders/[id]/refund` (owner/manager):

1. Load order; require `paymentStatus === "paid"` and a `stripePaymentIntentId`.
2. `stripe.refunds.create({ payment_intent })`.
3. Set `paymentStatus = "refunded"`.
4. If delivery **and** delivery status is before `courier_picked_up`:
   `cancelDelivery(externalDeliveryId)` (new DoorDash client fn) and set order
   `status = "cancelled"`.
5. Return updated order. Orders board shows a "Refund" button on paid orders.

`charge.refunded` webhook also flips `paymentStatus = "refunded"` (covers
refunds initiated from the Stripe dashboard).

## Components / new files

| File | Purpose |
|------|---------|
| `src/lib/stripe/client.ts` | Stripe SDK singleton (`STRIPE_SECRET_KEY`) |
| `src/lib/stripe/webhook.ts` | `constructEvent(rawBody, sig)` signature verification |
| `src/app/api/checkout/session/route.ts` | Create pending order + embedded Checkout Session |
| `src/app/api/stripe/webhook/route.ts` | Confirm payment → mark paid + dispatch; handle refunds |
| `src/app/api/admin/orders/[id]/refund/route.ts` | Admin refund + delivery cancel |
| `src/lib/doordash/client.ts` | add `cancelDelivery(externalDeliveryId)` |
| `src/lib/orders/place-order.ts` | refactor into `createOrderRecord` + `dispatchDelivery` |
| `src/app/checkout/page.tsx` | replace demo notice with `<EmbeddedCheckoutProvider>` form |
| `src/db/schema.ts` | `orders.status` already free-text; no column change needed (uses `stripePaymentIntentId`, `stripeCheckoutSessionId` already present) |

No DB migration required — the `orders` table already has
`stripe_payment_intent_id` and `stripe_checkout_session_id`. `pending_payment`
is a new string value for the existing `status` column.

## Status machine (`src/lib/orders/status.ts`)

- Add `pending_payment` as a known pre-state.
- `canTransition`: `pending_payment → received` allowed for actor `"webhook"`
  (payment confirmation) and `"staff"` is not needed. `pending_payment →
  cancelled` allowed.
- The board's "active" lane query excludes `pending_payment`.

## Dependencies

```
stripe                      # server SDK
@stripe/stripe-js           # browser loader
@stripe/react-stripe-js     # EmbeddedCheckoutProvider / EmbeddedCheckout
```

## Environment variables

| Variable | Scope | Notes |
|----------|-------|-------|
| `STRIPE_SECRET_KEY` | server | `sk_test_…` then `sk_live_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | client | `pk_test_…` then `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | server | `whsec_…` from the dashboard endpoint (or Stripe CLI for local) |

All three are already in `.env.local` (test mode). Push to Vercel before deploy.

## Error handling & edge cases

- **Webhook signature invalid** → `400`, no state change.
- **Idempotency** → webhook skips if `paymentStatus` already `paid` (re-delivery
  safe). `dispatchDelivery` skips if a `deliveries` row exists.
- **DoorDash quote expired at dispatch** → re-quote from stored order fields,
  then accept. If re-quote/accept fails → log, leave order `received` + paid,
  surface a "delivery not dispatched" flag for staff (board), do **not** refund
  automatically.
- **Payment fails / customer abandons** → order stays `pending_payment`, no
  dispatch, no charge. Customer can retry (new session → new order row).
- **Amount tampering** → impossible; amount is server-computed from the catalog.
- **Refund without payment intent** → `409`.

## Testing

- **Unit:** `createOrderRecord` / `dispatchDelivery` split; status-machine
  `pending_payment` transitions; webhook event handling (mock Stripe event).
- **Stripe test cards:** `4242 4242 4242 4242` (success), `4000 0000 0000 9995`
  (declined). Test mode only.
- **Local webhook:** `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
- **Deployed:** Stripe dashboard test endpoint → place a test order on the
  preview/prod site → verify order goes `pending_payment → received`, paid,
  and (delivery) dispatched.

## Out of scope (v1)

- Saved cards / customer accounts.
- Partial refunds (full refund only).
- Abandoned-order cron cleanup (documented; manual for now).
- Applying `promos` discounts at checkout (P5 table exists; separate task).
- Live-mode cutover (separate, mirrors DoorDash: swap keys, prod webhook).

## Rollout

1. Build behind test keys; verify locally + on preview.
2. Deploy with test keys to prod; full test-card run.
3. Live cutover: swap `sk_live`/`pk_live`, create a **live** dashboard webhook
   endpoint, set `STRIPE_WEBHOOK_SECRET` to its secret, redeploy.
