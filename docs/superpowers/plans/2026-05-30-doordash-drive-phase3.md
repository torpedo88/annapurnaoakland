# DoorDash Drive + Server Orders — Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or executing-plans. Steps use `- [ ]`.

**Goal:** Persist orders in Postgres and dispatch a DoorDash **Drive** driver for delivery orders, with live status via webhooks and customer tracking on `/order/[id]`. Pickup orders persist without a driver.

**Architecture:** Reuse the existing Drizzle/`postgres` setup (`src/db`). Add a `deliveries` table. A self-contained Drive client (`src/lib/doordash/*`) signs JWTs (HS256, `dd-ver: DD-JWT-V1`) and calls `https://openapi.doordash.com`. Server routes: quote (checkout), create order (+dispatch on delivery), and a webhook that updates status. Checkout calls these instead of the localStorage demo. `/order/[id]` reads the DB.

**Tech Stack:** Next.js 16 route handlers (Node runtime), Drizzle ORM + `postgres`, Node `crypto` (no new JWT dep), Zod (if present; else manual validation).

**Hard prerequisites (user-provided, NOT code):**
- `DATABASE_URL` reachable Postgres (existing).
- `DOORDASH_DEVELOPER_ID`, `DOORDASH_KEY_ID`, `DOORDASH_SIGNING_SECRET` (Drive credentials).
- `DOORDASH_WEBHOOK_SECRET` (set when configuring the webhook in the Drive portal).
- `RESTAURANT_PICKUP_ADDRESS`, `RESTAURANT_PICKUP_PHONE`, `NEXT_PUBLIC_BASE_URL`.
Payment (Stripe) is intentionally OUT of scope here — orders persist as `confirmed`; add payment later.

---

## Reference (DoorDash Drive, verified against developer.doordash.com)

- **Base URL:** `https://openapi.doordash.com`
- **JWT header:** `{"alg":"HS256","typ":"JWT","dd-ver":"DD-JWT-V1"}`
- **JWT payload:** `{"aud":"doordash","iss":<DEVELOPER_ID>,"kid":<KEY_ID>,"iat":<now>,"exp":<now+300>}` (exp ≤ iat+1800)
- **Signing:** HMAC-SHA256 with the signing secret **base64url-decoded to bytes**.
- **Auth header:** `Authorization: Bearer <jwt>`
- **Endpoints (money in integer cents):**
  - `POST /drive/v2/quotes` → quote. Body: `external_delivery_id, pickup_address, pickup_phone_number, dropoff_address, dropoff_phone_number, order_value`. Returns `fee, currency, duration?, dropoff_time_estimated?`.
  - `POST /drive/v2/quotes/{external_delivery_id}/accept` → creates the delivery, returns `tracking_url`, `fee`, `delivery_status`.
  - `GET /drive/v2/deliveries/{external_delivery_id}` → current status + `tracking_url`.
- **Webhook:** POST to our endpoint; verify with HMAC-SHA256 of the raw body using `DOORDASH_WEBHOOK_SECRET` (header `X-DoorDash-Signature`, base64). Payload includes `event_name`, `external_delivery_id`, `delivery_status`/`event_category`, `dasher_*`, `tracking_url`. (Confirm exact field names against the live webhook reference; map defensively.)

---

## File Structure

```
src/
  lib/
    env.ts                         # typed, server-only env accessor
    doordash/
      jwt.ts                       # createDriveJwt()
      client.ts                    # quote / acceptQuote / getDelivery
      types.ts                     # request/response + DeliveryStatus
      webhook.ts                   # verifyWebhookSignature(), parseEvent()
    orders/
      create-order.ts              # persist order + items (Drizzle)
      money.ts                     # dollars<->cents helpers
  db/
    schema.ts                      # + deliveries table (MODIFY)
  app/
    api/
      delivery/quote/route.ts      # POST quote for an address
      orders/route.ts              # POST create order (+dispatch if delivery)
      doordash/webhook/route.ts    # POST status updates
    checkout/page.tsx              # wire to APIs (MODIFY)
    order/[id]/page.tsx            # read DB + show delivery status (MODIFY)
  app/api/orders/[id]/route.ts     # GET order+delivery for tracking
drizzle/migrations/               # generated SQL (db:generate)
.env.example                      # + DOORDASH_*, RESTAURANT_*, NEXT_PUBLIC_BASE_URL (MODIFY)
```

---

### Task 1: Typed env accessor

**Files:** Create `src/lib/env.ts`

- [ ] Implement a server-only accessor that throws clearly if a required var is missing at call time (not import time, so the client build doesn't break):

```ts
import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  doordash: () => ({
    developerId: required("DOORDASH_DEVELOPER_ID"),
    keyId: required("DOORDASH_KEY_ID"),
    signingSecret: required("DOORDASH_SIGNING_SECRET"),
    webhookSecret: required("DOORDASH_WEBHOOK_SECRET"),
  }),
  restaurant: () => ({
    pickupAddress: required("RESTAURANT_PICKUP_ADDRESS"),
    pickupPhone: required("RESTAURANT_PICKUP_PHONE"),
  }),
  baseUrl: () => process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
};
```

- [ ] Verify: `npx tsc --noEmit`. Commit.

---

### Task 2: Drive JWT signer (+ smoke test)

**Files:** Create `src/lib/doordash/jwt.ts`

- [ ] Implement HS256 JWT with the `dd-ver` header using Node `crypto`, base64url throughout, secret base64url-decoded:

```ts
import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function decodeSecret(secret: string): Buffer {
  // DoorDash signing secret is URL-safe base64.
  const norm = secret.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(norm, "base64");
}

/** Returns a short-lived (5 min) Drive JWT. */
export function createDriveJwt(): string {
  const { developerId, keyId, signingSecret } = env.doordash();
  const header = { alg: "HS256", typ: "JWT", "dd-ver": "DD-JWT-V1" };
  const iat = Math.floor(Date.now() / 1000);
  const payload = { aud: "doordash", iss: developerId, kid: keyId, iat, exp: iat + 300 };
  const signingInput =
    b64url(Buffer.from(JSON.stringify(header))) + "." + b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac("sha256", decodeSecret(signingSecret)).update(signingInput).digest());
  return `${signingInput}.${sig}`;
}
```

- [ ] **Smoke test** (no network): `src/lib/doordash/jwt.smoke.ts`

```ts
// Run: DOORDASH_DEVELOPER_ID=d DOORDASH_KEY_ID=k DOORDASH_SIGNING_SECRET=$(node -e "console.log(Buffer.from('secret').toString('base64url'))") DOORDASH_WEBHOOK_SECRET=w RESTAURANT_PICKUP_ADDRESS=a RESTAURANT_PICKUP_PHONE=p npx tsx src/lib/doordash/jwt.smoke.ts
import { createDriveJwt } from "./jwt";
const t = createDriveJwt();
const [h, p] = t.split(".");
const dec = (s: string) => JSON.parse(Buffer.from(s, "base64").toString());
console.assert(dec(h)["dd-ver"] === "DD-JWT-V1", "header dd-ver");
console.assert(dec(p).aud === "doordash", "aud");
console.assert(dec(p).exp - dec(p).iat === 300, "exp window");
console.log("JWT smoke OK:", t.slice(0, 24) + "...");
```

- [ ] Run the smoke command above; expect "JWT smoke OK". Delete the smoke file is NOT required (keep for future). Commit.

---

### Task 3: Drive types + client

**Files:** Create `src/lib/doordash/types.ts`, `src/lib/doordash/client.ts`

- [ ] `types.ts`: 

```ts
export type DeliveryStatus =
  | "quote" | "created" | "confirmed" | "enroute_to_pickup" | "picked_up"
  | "enroute_to_dropoff" | "delivered" | "cancelled";

export interface QuoteInput {
  externalDeliveryId: string;
  dropoffAddress: string;
  dropoffPhone: string;
  orderValueCents: number;
}
export interface QuoteResult {
  externalDeliveryId: string;
  feeCents: number;
  currency: string;
  durationSeconds: number | null;
}
export interface AcceptResult {
  externalDeliveryId: string;
  feeCents: number;
  trackingUrl: string | null;
  status: string;
}
```

- [ ] `client.ts`: thin fetch wrapper. Each call mints a fresh JWT. Throws `DriveApiError` with status + body on non-2xx (no silent failure).

```ts
import { createDriveJwt } from "./jwt";
import { env } from "@/lib/env";
import type { QuoteInput, QuoteResult, AcceptResult } from "./types";

const BASE = "https://openapi.doordash.com";

export class DriveApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`DoorDash Drive API ${status}: ${body}`);
    this.name = "DriveApiError";
  }
}

async function driveFetch(path: string, init: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${createDriveJwt()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new DriveApiError(res.status, text);
  return text ? JSON.parse(text) : {};
}

export async function quoteDelivery(input: QuoteInput): Promise<QuoteResult> {
  const r = await driveFetch("/drive/v2/quotes", {
    method: "POST",
    body: JSON.stringify({
      external_delivery_id: input.externalDeliveryId,
      pickup_address: env.restaurant().pickupAddress,
      pickup_phone_number: env.restaurant().pickupPhone,
      dropoff_address: input.dropoffAddress,
      dropoff_phone_number: input.dropoffPhone,
      order_value: input.orderValueCents,
    }),
  });
  return {
    externalDeliveryId: r.external_delivery_id,
    feeCents: r.fee ?? 0,
    currency: r.currency ?? "USD",
    durationSeconds: r.duration ?? null,
  };
}

export async function acceptQuote(externalDeliveryId: string): Promise<AcceptResult> {
  const r = await driveFetch(`/drive/v2/quotes/${externalDeliveryId}/accept`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return {
    externalDeliveryId: r.external_delivery_id ?? externalDeliveryId,
    feeCents: r.fee ?? 0,
    trackingUrl: r.tracking_url ?? null,
    status: r.delivery_status ?? "created",
  };
}

export async function getDelivery(externalDeliveryId: string) {
  return driveFetch(`/drive/v2/deliveries/${externalDeliveryId}`, { method: "GET" });
}
```

- [ ] `npx tsc --noEmit`. Commit.

---

### Task 4: Webhook verification

**Files:** Create `src/lib/doordash/webhook.ts`

- [ ] HMAC verify (timing-safe) + defensive event parse:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", env.doordash().webhookSecret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface DriveEvent {
  externalDeliveryId: string | null;
  status: string | null;
  trackingUrl: string | null;
  eventName: string | null;
}
export function parseEvent(body: unknown): DriveEvent {
  const o = (body ?? {}) as Record<string, unknown>;
  return {
    externalDeliveryId: (o.external_delivery_id as string) ?? null,
    status: (o.delivery_status as string) ?? (o.event_category as string) ?? null,
    trackingUrl: (o.tracking_url as string) ?? null,
    eventName: (o.event_name as string) ?? null,
  };
}
```

- [ ] `npx tsc --noEmit`. Commit.

---

### Task 5: `deliveries` table

**Files:** Modify `src/db/schema.ts`; run `npm run db:generate`

- [ ] Append a `deliveries` table referencing `orders`:

```ts
export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().default(genUuid()),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  externalDeliveryId: text("external_delivery_id").notNull().unique(),
  provider: text("provider").default("doordash_drive"),
  status: text("status").default("created"),
  feeCents: integer("fee_cents"),
  currency: text("currency").default("USD"),
  trackingUrl: text("tracking_url"),
  dropoffAddress: text("dropoff_address"),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});
```

- [ ] Run `npm run db:generate` (generates SQL only; no DB connection needed). Commit schema + generated migration. NOTE: applying it (`npm run db:push`) requires a live DB — that is a user activation step, not part of this commit.

---

### Task 6: Order persistence helper

**Files:** Create `src/lib/orders/money.ts`, `src/lib/orders/create-order.ts`

- [ ] `money.ts`: `export const toCents = (d: number) => Math.round(d * 100); export const toDollars = (c: number) => (c / 100).toFixed(2);`
- [ ] `create-order.ts`: insert into `orders` + `orderItems` in a transaction, return `{ orderId }`. Input shape mirrors the checkout form (name, phone, email, fulfillment, address?, items[], subtotal, tax, tip, deliveryFee). Decimal columns take strings (`.toFixed(2)`).

```ts
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";

export interface NewOrderInput {
  name: string; phone: string; email: string;
  fulfillment: "pickup" | "delivery";
  address?: string;
  items: { id: string; name: string; price: number; qty: number }[];
  subtotal: number; tax: number; tip: number; deliveryFee: number;
}

export async function createOrder(input: NewOrderInput): Promise<{ orderId: string }> {
  const total = input.subtotal + input.tax + input.tip + input.deliveryFee;
  return db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({
      customerName: input.name,
      customerEmail: input.email,
      customerPhone: input.phone,
      orderType: input.fulfillment,
      status: "confirmed",
      subtotal: input.subtotal.toFixed(2),
      tax: input.tax.toFixed(2),
      tip: input.tip.toFixed(2),
      deliveryFee: input.deliveryFee.toFixed(2),
      total: total.toFixed(2),
      deliveryAddress: input.address ?? null,
    }).returning({ id: orders.id });
    if (!order) throw new Error("Order insert failed");
    await tx.insert(orderItems).values(
      input.items.map((it) => ({
        orderId: order.id,
        itemName: it.name,
        itemPrice: it.price.toFixed(2),
        quantity: it.qty,
      })),
    );
    return { orderId: order.id };
  });
}
```

- [ ] `npx tsc --noEmit`. Commit.

---

### Task 7: Quote route

**Files:** Create `src/app/api/delivery/quote/route.ts`

- [ ] `export const runtime = "nodejs";` POST `{ address, phone, subtotal }` → `quoteDelivery` with a generated `external_delivery_id` (return it so the order can accept the same quote). Validate inputs; return 400 on missing; surface Drive errors as 502 with message (no silent failure).

```ts
import { NextResponse } from "next/server";
import { quoteDelivery } from "@/lib/doordash/client";
import { toCents } from "@/lib/orders/money";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { address, phone, subtotal } = await req.json();
  if (!address || !phone) return NextResponse.json({ error: "address and phone required" }, { status: 400 });
  const externalDeliveryId = `anp-${randomUUID()}`;
  try {
    const q = await quoteDelivery({
      externalDeliveryId, dropoffAddress: address, dropoffPhone: phone,
      orderValueCents: toCents(Number(subtotal) || 0),
    });
    return NextResponse.json({ externalDeliveryId, feeCents: q.feeCents, durationSeconds: q.durationSeconds });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "quote failed" }, { status: 502 });
  }
}
```

- [ ] `npm run build`. Commit.

---

### Task 8: Create-order route (+ dispatch)

**Files:** Create `src/app/api/orders/route.ts`

- [ ] `runtime = "nodejs"`. POST the checkout payload (incl. optional `externalDeliveryId` from the quote step). Create the order; if delivery, `acceptQuote(externalDeliveryId)` and insert a `deliveries` row with the returned fee/tracking/status. If dispatch fails, the order is still persisted — return `{ orderId, deliveryError }` so the customer isn't lost (flagged for manual dispatch; no silent loss). Return `{ orderId }`.

```ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { deliveries } from "@/db/schema";
import { createOrder } from "@/lib/orders/create-order";
import { acceptQuote } from "@/lib/doordash/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.name || !body?.phone) return NextResponse.json({ error: "name and phone required" }, { status: 400 });
  if (body.fulfillment === "delivery" && !body.address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const { orderId } = await createOrder(body);

  if (body.fulfillment === "delivery" && body.externalDeliveryId) {
    try {
      const d = await acceptQuote(body.externalDeliveryId);
      await db.insert(deliveries).values({
        orderId,
        externalDeliveryId: d.externalDeliveryId,
        status: d.status,
        feeCents: d.feeCents,
        trackingUrl: d.trackingUrl,
        dropoffAddress: body.address,
      });
    } catch (e) {
      return NextResponse.json({ orderId, deliveryError: e instanceof Error ? e.message : "dispatch failed" });
    }
  }
  return NextResponse.json({ orderId });
}
```

- [ ] `npm run build`. Commit.

---

### Task 9: Webhook route

**Files:** Create `src/app/api/doordash/webhook/route.ts`

- [ ] `runtime = "nodejs"`. Read the **raw** body text (needed for signature), verify, parse, update the matching `deliveries` row (and mirror terminal states to `orders.status`). Always return 200 quickly after processing to avoid ret ries on handled events; return 401 on bad signature.

```ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { deliveries, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, parseEvent } from "@/lib/doordash/webhook";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-doordash-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  const evt = parseEvent(JSON.parse(raw));
  if (!evt.externalDeliveryId) return NextResponse.json({ ok: true });

  const [row] = await db.update(deliveries)
    .set({ status: evt.status ?? undefined, trackingUrl: evt.trackingUrl ?? undefined, raw: JSON.parse(raw), updatedAt: new Date() })
    .where(eq(deliveries.externalDeliveryId, evt.externalDeliveryId))
    .returning({ orderId: deliveries.orderId });

  if (row && evt.status === "delivered") {
    await db.update(orders).set({ status: "completed" }).where(eq(orders.id, row.orderId));
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] `npm run build`. Commit.

---

### Task 10: Order read route + tracking page

**Files:** Create `src/app/api/orders/[id]/route.ts`; modify `src/app/order/[id]/page.tsx`

- [ ] GET route returns the order + its delivery row (joined). 
- [ ] Update `/order/[id]` to fetch from that route (replace the localStorage read), render existing pickup steps for pickup orders, and for delivery show the Drive status + a "Track your driver" link (`trackingUrl`). Keep the dark-luxe styling. Poll the GET route every ~20s for status (until delivered/cancelled).

- [ ] `npm run build`. Commit.

---

### Task 11: Wire checkout to the API

**Files:** Modify `src/app/checkout/page.tsx`

- [ ] On `fulfillment === "delivery"`: when address+phone are filled, call `POST /api/delivery/quote` (debounced) to show the live delivery fee + ETA (replace the hardcoded `4.99`). Store the returned `externalDeliveryId`.
- [ ] On submit: `POST /api/orders` with the form + items (+ `externalDeliveryId` for delivery). On success, `clear()` cart and `router.push('/order/'+orderId)`. Surface `deliveryError` (if any) as a non-blocking notice on the confirmation. Remove the `appendOrder`/localStorage demo path.
- [ ] Keep dark-luxe styling. `npm run build`. Commit.

---

### Task 12: env example + activation docs

**Files:** Modify `.env.example`

- [ ] Add (NO real values):

```
DATABASE_URL=postgresql://user:pass@host:5432/db
DOORDASH_DEVELOPER_ID=
DOORDASH_KEY_ID=
DOORDASH_SIGNING_SECRET=
DOORDASH_WEBHOOK_SECRET=
RESTAURANT_PICKUP_ADDRESS=948 Clay Street, Oakland, CA 94607
RESTAURANT_PICKUP_PHONE=+15102509696
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] Commit.

---

## Activation steps (USER — outside this plan, require secrets/DB)

1. Set the env vars above in `.env.local` (and Vercel project env) — never commit real values.
2. `npm run db:push` (or apply the generated migration) against the live DB to create `orders`/`order_items`/`deliveries` etc.
3. In the DoorDash Drive portal, set the webhook URL to `https://<your-domain>/api/doordash/webhook` and copy its secret into `DOORDASH_WEBHOOK_SECRET`.
4. Sandbox test: place a delivery order → confirm a quote fee shows, an order row + delivery row are created, the Drive sandbox returns a tracking URL, and a simulated status webhook flips the order to delivered.

## Self-review checklist
- Money handled in integer cents for Drive; decimals stored as 2dp strings for Drizzle `decimal`.
- No secrets in code; all via `env.ts`; `server-only` guards.
- No silent failures: Drive errors → 502 / surfaced; dispatch failure keeps the paid order and flags it; webhook bad-signature → 401.
- Routes are `runtime = "nodejs"` (crypto + postgres need Node, not Edge).
- Pickup path persists too (no driver). Delivery path quotes → accepts → tracks.

## Out of scope
- Stripe payment (orders are `confirmed` without charge for now).
- Tip/loyalty syncing to Drive; scheduled deliveries; multi-pickup.
