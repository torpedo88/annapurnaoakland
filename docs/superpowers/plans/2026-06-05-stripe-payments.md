# Stripe Embedded Checkout Payments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take card payment online (Stripe Embedded Checkout) for every customer order — pickup and delivery — before dispatch, and add refunds (with delivery cancellation) to the admin orders board.

**Architecture:** Online checkout creates a `pending_payment` order, then a Stripe Embedded Checkout Session. A signed `checkout.session.completed` webhook marks the order paid, advances it to `received`, and (for delivery) dispatches the DoorDash driver. Manual/phone admin orders keep today's immediate-dispatch flow. Spec: `docs/superpowers/specs/2026-06-05-stripe-payments-design.md`.

**Tech Stack:** Next.js 16 (App Router), Drizzle, Stripe Node SDK + `@stripe/react-stripe-js` (Embedded Checkout), DoorDash Drive, Vitest.

**Conventions:** API routes `export const runtime = "nodejs"`. Money is in cents server-side. Never trust client amounts. Run the `server-only` shim for any `tsx` script (see ARCHITECTURE §11). Commit after each task.

---

## File structure

| File | Create/Modify | Responsibility |
|------|---------------|----------------|
| `src/lib/stripe/client.ts` | Create | Stripe SDK singleton |
| `src/lib/stripe/webhook.ts` | Create | Verify webhook signature → Stripe event |
| `src/lib/stripe/webhook.test.ts` | Create | Unit test for verify wrapper |
| `src/lib/orders/status.ts` | Modify | Add `pending_payment` pre-state |
| `src/lib/orders/status.test.ts` | Modify | Cover new transitions |
| `src/lib/orders/create-order.ts` | Modify | Accept a `status` (default `received`) |
| `src/lib/orders/place-order.ts` | Modify | Add `createPendingOrder` + `dispatchPaidOrder`; keep `placeOrder` |
| `src/lib/doordash/client.ts` | Modify | Add `cancelDelivery` |
| `src/lib/doordash/types.ts` | Modify | Add cancel result type (if needed) |
| `src/app/api/checkout/session/route.ts` | Create | Create pending order + embedded Checkout Session |
| `src/app/api/stripe/webhook/route.ts` | Create | Confirm payment → mark paid + dispatch; refunds |
| `src/app/api/admin/orders/[id]/refund/route.ts` | Create | Admin refund + delivery cancel |
| `src/app/checkout/page.tsx` | Modify | Replace demo notice with Embedded Checkout |
| `src/components/admin/order-card.tsx` | Modify | Refund button on paid orders |
| `src/components/admin/orders-board.tsx` | Modify | Refund handler |
| `src/lib/env.ts` | Modify | Add Stripe accessors |
| `.env.example` | Modify | Document Stripe vars |

---

### Task 1: Install dependencies + env accessors

**Files:**
- Modify: `package.json` (via npm)
- Modify: `src/lib/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Install Stripe packages**

Run:
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```
Expected: three packages added to `dependencies`.

- [ ] **Step 2: Add Stripe accessors to `src/lib/env.ts`**

Add inside the `env` object (after `staffSessionSecret`):
```ts
  stripe: () => ({
    secretKey: required("STRIPE_SECRET_KEY"),
    webhookSecret: required("STRIPE_WEBHOOK_SECRET"),
  }),
```
(The publishable key is read client-side via `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` directly — `NEXT_PUBLIC_*` vars are inlined at build, not read through `env.ts`.)

- [ ] **Step 3: Document vars in `.env.example`**

Append:
```
# Stripe (test keys for dev, live keys for production)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/env.ts .env.example
git commit -m "chore(stripe): add SDK deps + env accessors"
```

---

### Task 2: Stripe server client + webhook verifier

**Files:**
- Create: `src/lib/stripe/client.ts`
- Create: `src/lib/stripe/webhook.ts`
- Create: `src/lib/stripe/webhook.test.ts`

- [ ] **Step 1: Create the SDK singleton `src/lib/stripe/client.ts`**

```ts
import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

/** Lazily-constructed Stripe client (so env is only read when actually used). */
export function stripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env.stripe().secretKey, { apiVersion: "2025-08-27.basil" });
  }
  return _stripe;
}
```
(If `tsc` complains about the `apiVersion` literal, set it to the value the installed `stripe` package's types expect — hover `Stripe.LatestApiVersion` — or omit the option to use the SDK default.)

- [ ] **Step 2: Create the verifier `src/lib/stripe/webhook.ts`**

```ts
import "server-only";
import type Stripe from "stripe";
import { stripe } from "./client";
import { env } from "@/lib/env";

/**
 * Verifies the Stripe-Signature header against the raw body and returns the
 * typed event. Throws if the signature is invalid (caller returns 400).
 */
export function constructStripeEvent(rawBody: string, signature: string | null): Stripe.Event {
  if (!signature) throw new Error("Missing Stripe-Signature header");
  return stripe().webhooks.constructEvent(rawBody, signature, env.stripe().webhookSecret);
}
```

- [ ] **Step 3: Write a failing test `src/lib/stripe/webhook.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// env requires real vars; stub them for the test.
vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_testsecret");

import Stripe from "stripe";
import { constructStripeEvent } from "./webhook";

describe("constructStripeEvent", () => {
  it("rejects a missing signature", () => {
    expect(() => constructStripeEvent("{}", null)).toThrow();
  });

  it("accepts a correctly-signed payload", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: {} } });
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_testsecret" });
    const evt = constructStripeEvent(payload, header);
    expect(evt.type).toBe("checkout.session.completed");
  });

  it("rejects a tampered payload", () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload: "{}", secret: "whsec_testsecret" });
    expect(() => constructStripeEvent('{"x":1}', header)).toThrow();
  });
});
```

- [ ] **Step 4: Run the test**

Run: `npm test -- src/lib/stripe/webhook.test.ts`
Expected: PASS (vitest already aliases `server-only`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/stripe
git commit -m "feat(stripe): SDK client + signed webhook verifier"
```

---

### Task 3: Add `pending_payment` order state

**Files:**
- Modify: `src/lib/orders/status.ts`
- Modify: `src/lib/orders/status.test.ts`

- [ ] **Step 1: Add the pre-state + transition to `src/lib/orders/status.ts`**

Add this exported constant near the top (after `TERMINAL`):
```ts
// Pre-state for online orders awaiting Stripe payment. Not part of the staff
// flow; excluded from the active orders board. Advanced to "received" by the
// payment webhook, or "cancelled" if abandoned.
export const PENDING_PAYMENT = "pending_payment";
```

In `canTransition`, add this just after the `if (to === "cancelled") return true;` line:
```ts
  // Payment confirmation: webhook moves a pending order into the kitchen flow.
  if (from === PENDING_PAYMENT) return to === "received" && actor === "webhook";
  if (to === PENDING_PAYMENT) return false;
```

- [ ] **Step 2: Add failing tests to `src/lib/orders/status.test.ts`**

Append:
```ts
import { canTransition, PENDING_PAYMENT } from "@/lib/orders/status";

describe("pending_payment", () => {
  it("webhook advances pending_payment → received", () => {
    expect(canTransition("delivery", PENDING_PAYMENT, "received", "webhook")).toBe(true);
    expect(canTransition("pickup", PENDING_PAYMENT, "received", "webhook")).toBe(true);
  });
  it("staff cannot advance pending_payment → received", () => {
    expect(canTransition("pickup", PENDING_PAYMENT, "received", "staff")).toBe(false);
  });
  it("pending_payment can be cancelled", () => {
    expect(canTransition("delivery", PENDING_PAYMENT, "cancelled", "webhook")).toBe(true);
  });
  it("nothing transitions into pending_payment", () => {
    expect(canTransition("pickup", "received", PENDING_PAYMENT, "staff")).toBe(false);
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `npm test -- src/lib/orders/status.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/orders/status.ts src/lib/orders/status.test.ts
git commit -m "feat(orders): add pending_payment pre-state + transitions"
```

---

### Task 4: `createOrder` accepts a status

**Files:**
- Modify: `src/lib/orders/create-order.ts`

- [ ] **Step 1: Add `status` to `NewOrderInput`**

In the `NewOrderInput` interface, add:
```ts
  status?: string; // defaults to "received"; online prepay uses "pending_payment"
```

- [ ] **Step 2: Use it in the insert**

In `create-order.ts`, change the insert's `status: "received",` line to:
```ts
        status: input.status ?? "received",
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (existing callers omit `status`, default preserved).

- [ ] **Step 4: Commit**

```bash
git add src/lib/orders/create-order.ts
git commit -m "feat(orders): createOrder accepts optional status"
```

---

### Task 5: `createPendingOrder` + `dispatchPaidOrder`

**Files:**
- Modify: `src/lib/orders/place-order.ts`

`placeOrder` (manual/admin path) stays untouched. Add two functions the online flow uses. Read the existing `placeOrder` for the imports/patterns (`acceptQuote`, `computeDeliveryFee`, `quoteDelivery`, `createOrder`, `deliveries`).

- [ ] **Step 1: Add `createPendingOrder` to `src/lib/orders/place-order.ts`**

Add these imports at the top if missing:
```ts
import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { quoteDelivery } from "@/lib/doordash/client";
import { priceOrder } from "@/lib/orders/pricing";
import { createOrder } from "@/lib/orders/create-order";
```

Add the function:
```ts
/**
 * Online prepay path: validate, price (incl. an authoritative delivery quote),
 * and persist an order as `pending_payment`. Does NOT dispatch a driver — that
 * happens only after Stripe confirms payment (see dispatchPaidOrder).
 * Returns the order id, capability token, and the charged total in cents.
 */
export async function createPendingOrder(
  input: PlaceOrderInput,
): Promise<{ orderId: string; accessToken: string; totalCents: number; deliveryFeeCents: number }> {
  const settings = await getSettings();
  if (settings.ordering_paused) throw new OrderError("Online ordering is paused. Please call the restaurant.", 503);
  if (input.fulfillment === "delivery" && !settings.delivery_enabled) throw new OrderError("Delivery is currently unavailable.", 503);
  if (input.fulfillment === "pickup" && !settings.pickup_enabled) throw new OrderError("Pickup is currently unavailable.", 503);

  try {
    validateContact(input);
    priceOrder(input.items, { tipCents: input.tipCents });
  } catch (e) {
    if (e instanceof OrderError) throw e;
    throw new OrderError(e instanceof PricingError ? e.message : "Invalid order", 400);
  }

  // Reject 86'd items (same guard as placeOrder).
  const itemIds = input.items.map((i) => String(i.id)).filter(Boolean);
  if (itemIds.length) {
    const rows = await db.select({ name: menuItems.name, isAvailable: menuItems.isAvailable })
      .from(menuItems).where(inArray(menuItems.slug, itemIds));
    const off = rows.filter((r) => r.isAvailable === false);
    if (off.length) throw new OrderError(`${off.map((r) => r.name).join(", ")} ${off.length > 1 ? "are" : "is"} currently unavailable.`, 409);
  }

  // Delivery fee: authoritative server quote (don't trust the client).
  let deliveryFeeCents = 0;
  if (input.fulfillment === "delivery") {
    if (!cleanString(input.address, 200)) throw new OrderError("Delivery address is required", 400);
    if (!isValidExternalDeliveryId(input.externalDeliveryId)) throw new OrderError("Invalid delivery reference", 400);
    const subtotalCents = priceOrder(input.items).subtotalCents;
    try { assertDeliverable({ subtotalCents }, settings.delivery); }
    catch (e) {
      if (e instanceof MinOrderError) throw new OrderError(`Delivery minimum is $${(e.minOrderCents / 100).toFixed(2)}.`, 400);
      throw e;
    }
    try {
      const q = await quoteDelivery({
        externalDeliveryId: input.externalDeliveryId as string,
        dropoffAddress: cleanString(input.address, 200),
        dropoffPhone: cleanString(input.phone, 30),
        orderValueCents: subtotalCents,
      });
      deliveryFeeCents = computeDeliveryFee({ doordashFeeCents: q.feeCents, subtotalCents }, settings.delivery).feeCents;
    } catch (e) {
      console.error("[createPendingOrder] quote failed:", e);
      throw new OrderError("Could not price delivery right now. Please try again.", 502);
    }
  }

  const { orderId, accessToken } = await createOrder({
    name: input.name, phone: input.phone, email: input.email,
    fulfillment: input.fulfillment, address: input.address,
    items: input.items, tipCents: input.tipCents, deliveryFeeCents,
    source: "online", paymentStatus: "unpaid", paymentMethod: "online",
    status: "pending_payment",
  });

  // Recompute the persisted total so the Stripe amount matches the DB exactly.
  const totals = priceOrder(input.items, { tipCents: input.tipCents, deliveryFeeCents, taxRate: settings.tax_rate });
  return { orderId, accessToken, totalCents: totals.totalCents, deliveryFeeCents };
}
```

- [ ] **Step 2: Add `dispatchPaidOrder` to the same file**

```ts
/**
 * Called after Stripe confirms payment. Marks the order paid + received and,
 * for delivery orders, dispatches the DoorDash driver (re-quoting if the
 * original quote expired). Idempotent: a second call with an existing delivery
 * row is a no-op for dispatch. `externalDeliveryId` comes from Stripe metadata.
 */
export async function dispatchPaidOrder(args: {
  orderId: string;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
  externalDeliveryId?: string;
}): Promise<void> {
  const [order] = await db.select().from(orders).where(eq(orders.id, args.orderId)).limit(1);
  if (!order) { console.error("[dispatchPaidOrder] order not found", args.orderId); return; }
  if (order.paymentStatus === "paid") return; // idempotent — already processed

  await db.update(orders).set({
    paymentStatus: "paid",
    status: order.status === "pending_payment" ? "received" : order.status,
    stripePaymentIntentId: args.paymentIntentId ?? undefined,
    stripeCheckoutSessionId: args.checkoutSessionId ?? undefined,
    updatedAt: new Date(),
  }).where(eq(orders.id, args.orderId));

  if (order.orderType !== "delivery") return;

  const [existing] = await db.select({ id: deliveries.id }).from(deliveries).where(eq(deliveries.orderId, args.orderId)).limit(1);
  if (existing) return; // already dispatched

  const edi = args.externalDeliveryId;
  if (!edi || !isValidExternalDeliveryId(edi)) { console.error("[dispatchPaidOrder] missing/invalid externalDeliveryId for", args.orderId); return; }

  try {
    let accepted;
    try {
      accepted = await acceptQuote(edi);
    } catch {
      // Quote likely expired — re-quote with the same id, then accept.
      await quoteDelivery({
        externalDeliveryId: edi,
        dropoffAddress: order.deliveryAddress ?? "",
        dropoffPhone: order.customerPhone ?? "",
        orderValueCents: Math.round(Number(order.subtotal ?? 0) * 100),
      });
      accepted = await acceptQuote(edi);
    }
    await db.insert(deliveries).values({
      orderId: args.orderId,
      externalDeliveryId: accepted.externalDeliveryId,
      status: accepted.status,
      feeCents: accepted.feeCents,
      trackingUrl: httpsUrlOrNull(accepted.trackingUrl),
      dropoffAddress: order.deliveryAddress ?? null,
    });
  } catch (e) {
    console.error("[dispatchPaidOrder] dispatch failed for paid order", args.orderId, e);
    // Order stays paid + received; staff coordinate manually. Do not auto-refund.
  }
}
```

Add any missing imports used above: `httpsUrlOrNull` (already imported in this file), `menuItems`, `inArray` (add `import { inArray } from "drizzle-orm"` and `menuItems` from schema if not present).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/orders/place-order.ts
git commit -m "feat(orders): createPendingOrder + dispatchPaidOrder for prepay flow"
```

---

### Task 6: DoorDash `cancelDelivery`

**Files:**
- Modify: `src/lib/doordash/client.ts`

- [ ] **Step 1: Add `cancelDelivery` to `src/lib/doordash/client.ts`**

Append:
```ts
/** Cancels a delivery. Safe to call only before pickup; DoorDash 4xx after. */
export async function cancelDelivery(externalDeliveryId: string): Promise<{ status: string }> {
  const r = await driveFetch(`/drive/v2/deliveries/${encodeURIComponent(externalDeliveryId)}/cancel`, {
    method: "PUT",
    body: JSON.stringify({}),
  });
  return { status: r.delivery_status ?? "cancelled" };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/doordash/client.ts
git commit -m "feat(doordash): cancelDelivery for refunds"
```

---

### Task 7: `POST /api/checkout/session`

**Files:**
- Create: `src/app/api/checkout/session/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server";
import { toCents } from "@/lib/orders/money";
import { createPendingOrder, OrderError } from "@/lib/orders/place-order";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const fulfillment = body?.fulfillment === "delivery" ? "delivery" : "pickup";

  let pending;
  try {
    pending = await createPendingOrder({
      name: body.name, phone: body.phone, email: body.email,
      fulfillment, address: body.address,
      items: (body?.items as { id: unknown; qty: unknown }[]) ?? [],
      tipCents: toCents(Number(body?.tip) || 0),
      externalDeliveryId: body.externalDeliveryId,
      source: "online",
    });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[checkout/session] pending order failed:", e);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }

  const base = env.baseUrl();
  try {
    const session = await stripe().checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pending.totalCents,
          product_data: { name: "Annapurna order" },
        },
      }],
      payment_intent_data: { metadata: { orderId: pending.orderId } },
      metadata: {
        orderId: pending.orderId,
        externalDeliveryId: typeof body.externalDeliveryId === "string" ? body.externalDeliveryId : "",
      },
      return_url: `${base}/order/${pending.orderId}?t=${pending.accessToken}&session_id={CHECKOUT_SESSION_ID}`,
    });
    return NextResponse.json({ clientSecret: session.client_secret, orderId: pending.orderId });
  } catch (e) {
    console.error("[checkout/session] stripe session failed:", e);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Typecheck + build the route**

Run: `npx tsc --noEmit && npx next build 2>&1 | grep -E "api/checkout/session|error"`
Expected: `ƒ /api/checkout/session` listed, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/checkout/session/route.ts
git commit -m "feat(checkout): POST /api/checkout/session — pending order + Stripe session"
```

---

### Task 8: `POST /api/stripe/webhook`

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { constructStripeEvent } from "@/lib/stripe/webhook";
import { dispatchPaidOrder } from "@/lib/orders/place-order";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  let event;
  try {
    event = constructStripeEvent(raw, req.headers.get("stripe-signature"));
  } catch (e) {
    console.error("[stripe webhook] bad signature:", (e as Error).message);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await dispatchPaidOrder({
            orderId,
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            checkoutSessionId: session.id,
            externalDeliveryId: session.metadata?.externalDeliveryId || undefined,
          });
        }
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
      if (pi) {
        await db.update(orders).set({ paymentStatus: "refunded", updatedAt: new Date() })
          .where(eq(orders.stripePaymentIntentId, pi));
      }
    }
  } catch (e) {
    console.error("[stripe webhook] handler error:", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 }); // Stripe retries
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && npx next build 2>&1 | grep -E "api/stripe/webhook|error"`
Expected: `ƒ /api/stripe/webhook` listed, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat(stripe): webhook — confirm payment, dispatch, refunds"
```

---

### Task 9: Admin refund route

**Files:**
- Create: `src/app/api/admin/orders/[id]/refund/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, deliveries } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe/client";
import { cancelDelivery } from "@/lib/doordash/client";

export const runtime = "nodejs";

// Delivery statuses at/after which the driver already has the food — too late to cancel.
const PICKED_UP = new Set(["courier_picked_up", "picked_up", "enroute_to_dropoff", "arrived_at_dropoff", "en_route", "delivered"]);

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireRole(["owner", "manager"]); }
  catch (e) { return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 }); }

  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus !== "paid" || !order.stripePaymentIntentId) {
    return NextResponse.json({ error: "Order is not refundable" }, { status: 409 });
  }

  try {
    await stripe().refunds.create({ payment_intent: order.stripePaymentIntentId });
  } catch (e) {
    console.error("[refund] stripe refund failed:", e);
    return NextResponse.json({ error: "Refund failed" }, { status: 502 });
  }

  let cancelledDelivery = false;
  if (order.orderType === "delivery") {
    const [d] = await db.select().from(deliveries).where(eq(deliveries.orderId, id)).limit(1);
    if (d && !PICKED_UP.has(d.status ?? "")) {
      try { await cancelDelivery(d.externalDeliveryId); cancelledDelivery = true; }
      catch (e) { console.error("[refund] delivery cancel failed (continuing):", e); }
    }
  }

  await db.update(orders).set({
    paymentStatus: "refunded",
    status: cancelledDelivery ? "cancelled" : order.status,
    updatedAt: new Date(),
  }).where(eq(orders.id, id));

  return NextResponse.json({ ok: true, refunded: true, cancelledDelivery });
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && npx next build 2>&1 | grep -E "refund|error"`
Expected: `ƒ /api/admin/orders/[id]/refund`, no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/admin/orders/[id]/refund/route.ts"
git commit -m "feat(admin): order refund + delivery cancel"
```

---

### Task 10: Checkout page — Embedded Checkout

**Files:**
- Modify: `src/app/checkout/page.tsx`

The page is a `<form onSubmit={...}>`. Change the submit so it creates a Stripe session and renders the embedded form instead of posting to `/api/orders`.

- [ ] **Step 1: Add imports at the top of `src/app/checkout/page.tsx`**

```ts
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

- [ ] **Step 2: Add state for the client secret**

Next to the other `useState` calls in the component:
```ts
const [clientSecret, setClientSecret] = useState<string | null>(null);
```

- [ ] **Step 3: Replace the submit handler body**

Find the `try { const res = await fetch("/api/orders", … )` block (around line 173). Replace the whole `fetch("/api/orders" …)` request + its response handling down to the success redirect with:
```ts
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          fulfillment,
          address: fulfillment === "delivery" ? address.trim() : undefined,
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          tip,
          externalDeliveryId: quote.externalDeliveryId ?? undefined,
        }),
      });
      const json = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !json.clientSecret) {
        setError(json.error ?? "Could not start checkout. Please try again.");
        setSubmitting(false);
        return;
      }
      setClientSecret(json.clientSecret);
      setSubmitting(false);
```
(Remove any now-unused redirect/`router.push` code in the old success branch. The Stripe `return_url` handles navigation to `/order/[id]` after payment.)

- [ ] **Step 4: Render the embedded checkout when we have a secret**

Replace the `{/* Payment (demo notice) */}` block (the dashed-border "Demo mode — no card required" card) with:
```tsx
            {/* Payment */}
            <div>
              <h2 className="text-lg font-bold mb-3" style={{ color: "#F3E9D6" }}>Payment</h2>
              {clientSecret ? (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff" }}>
                  <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              ) : (
                <div className="rounded-2xl p-5" style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.2)" }}>
                  <p className="text-sm" style={{ color: "#8A8276" }}>
                    Review your order, then continue to secure card payment (Apple Pay & Google Pay supported).
                  </p>
                </div>
              )}
            </div>
```

- [ ] **Step 5: Hide the summary "Place order" button once payment is showing**

In the sidebar submit button, change the label/disabled logic. Replace the `<button type="submit" …>` block with:
```tsx
              {!clientSecret && (
                <button
                  type="submit"
                  disabled={submitting || (fulfillment === "delivery" && quote.loading)}
                  className="mt-5 w-full inline-flex justify-center items-center gap-2 rounded-full py-4 font-bold text-base transition disabled:opacity-60 disabled:cursor-wait"
                  style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
                >
                  {submitting ? "Starting checkout…" : `Continue to payment · $${total.toFixed(2)}`}
                </button>
              )}
```

- [ ] **Step 6: Typecheck + build**

Run: `npx tsc --noEmit && npx next build 2>&1 | grep -E "/checkout|error"`
Expected: `/checkout` builds, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/checkout/page.tsx
git commit -m "feat(checkout): Stripe Embedded Checkout (replaces demo payment)"
```

---

### Task 11: Refund button on the orders board

**Files:**
- Modify: `src/components/admin/order-card.tsx`
- Modify: `src/components/admin/orders-board.tsx`

- [ ] **Step 1: Add an `onRefund` prop + button to `src/components/admin/order-card.tsx`**

In the `OrderCard` props type, add:
```ts
  onRefund: (id: string) => void;
```
Add `onRefund` to the destructured params: `{ order, busy, onStatus, onPayment, onRefund }`.

In the payment row (where the "Paid · cash/card" buttons live), add — shown only for paid orders:
```tsx
        {order.paymentStatus === "paid" && (
          <button disabled={busy} onClick={() => { if (confirm("Refund this order? This cannot be undone.")) onRefund(order.id); }}
            className="px-2 py-1 rounded" style={{ border: "1px solid rgba(220,38,38,0.4)", color: "#E0807A" }}>
            Refund
          </button>
        )}
```

- [ ] **Step 2: Add the refund handler in `src/components/admin/orders-board.tsx`**

Add this function next to `patchPayment`:
```ts
  const refund = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/admin/orders/${id}/refund`, { method: "POST" });
    setBusyId(null);
    load(lane);
  };
```

Pass it to the card — update the `<OrderCard … />` render to include:
```tsx
        <OrderCard key={o.id} order={o} busy={busyId === o.id} onStatus={patchStatus} onPayment={patchPayment} onRefund={refund} />
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npx next build 2>&1 | grep -E "error|Compiled"`
Expected: Compiled successfully, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/order-card.tsx src/components/admin/orders-board.tsx
git commit -m "feat(admin): refund button on paid orders"
```

> Note: the active orders board already excludes `pending_payment` — its lane
> query (`GET /api/admin/orders`) only selects known lane statuses, and
> `pending_payment` is in none of them. No change needed there.

---

### Task 12: Push env to Vercel + deploy + verify

**Files:** none (ops)

- [ ] **Step 1: Push the Stripe vars + base URL to Vercel (test keys)**

`NEXT_PUBLIC_BASE_URL` must be set in prod, or the Stripe `return_url` falls back
to `localhost` (broken post-payment redirect). Set it first:

```bash
printf '%s' "https://annapurnaoakland.vercel.app" | npx vercel env add NEXT_PUBLIC_BASE_URL production
for v in STRIPE_SECRET_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET; do
  val=$(grep "^$v=" .env.local | cut -d= -f2-)
  printf '%s' "$val" | npx vercel env add "$v" production
done
```
Expected: four vars added (secret values never printed). Also add
`NEXT_PUBLIC_BASE_URL=http://localhost:3000` to `.env.local` if missing, so the
local return_url works.

- [ ] **Step 2: Deploy**

```bash
git push origin <branch>
npx vercel --prod --yes
```
Expected: `Aliased: https://annapurnaoakland.vercel.app`.

- [ ] **Step 3: Verify the webhook endpoint authenticates**

The Stripe dashboard test endpoint should already point at
`https://annapurnaoakland.vercel.app/api/stripe/webhook`. Send a test event
from the Stripe dashboard (Developers → Webhooks → your endpoint → Send test
event → `checkout.session.completed`). Expected: `200` in the dashboard delivery
log. An unsigned `curl` POST returns `400`.

- [ ] **Step 4: End-to-end with a test card**

On `https://annapurnaoakland.vercel.app`: add an item, go to checkout, choose
pickup, Continue to payment, pay with `4242 4242 4242 4242` (any future expiry,
any CVC/ZIP). Expected: redirect to `/order/[id]`, order shows **paid** +
**received** on the admin board. Repeat with **delivery** to a nearby address
and confirm a `deliveries` row + tracking URL appear.

- [ ] **Step 5: Verify refund**

On the admin orders board, click **Refund** on the test order. Expected: order
shows **refunded**; for the delivery test (if not picked up) it also flips to
**cancelled**; the refund appears in the Stripe dashboard.

---

## Self-review notes

- **Spec coverage:** prepay both fulfillments (T7/T10), Embedded Checkout (T10), charge-then-dispatch via `pending_payment` (T3/T5/T8), manual orders unchanged (`placeOrder` untouched, T5), refund + delivery cancel (T6/T9/T11), env (T1/T12), edge cases — quote expiry (T5 `dispatchPaidOrder` re-quote), idempotency (T5 paid-check + delivery-row check), abandoned payment (order stays `pending_payment`, no dispatch), amount integrity (T7 server-computed total). ✅
- **Naming consistency:** `createPendingOrder`, `dispatchPaidOrder`, `cancelDelivery`, `constructStripeEvent`, `stripe()` used identically across tasks.
- **Manual the engineer should read before T5/T10:** existing `place-order.ts` (imports + `PlaceOrderInput`), `create-order.ts`, `pricing.ts` (`priceOrder` returns `subtotalCents`/`totalCents`), and `docs/DOORDASH.md`.
- **Stripe API version:** if the pinned `apiVersion` string in T2 mismatches the installed SDK's types, use the SDK's `LatestApiVersion` or omit the option.
