# Admin Panel P2 — Live Order Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the localStorage order dashboard with a live DB-backed board: two fulfillment-specific status workflows, manual/phone order entry, and manual payment tracking.

**Architecture:** A pure `status.ts` state-machine module gates all status changes (staff vs DoorDash webhook actors). The customer order dispatch/persist path is extracted into a shared `placeOrder()` reused by a new admin manual-order route. The dashboard polls role-gated `/api/admin/orders` every ~10s and renders lanes with status/payment actions + a WebAudio new-order alert.

**Tech Stack:** Next 16.2.4 (App Router, proxy guard on `/admin` + `/api/admin`), React 19, Drizzle + postgres.js, Supabase project `zfnhcuvgvnflduqeiyin`, Vitest.

**Spec:** `docs/superpowers/specs/2026-05-31-admin-panel-p2-orders-design.md`

---

## Conventions

- Branch: continue on `feat/admin-panel-p0-p1` (P0+P1 already here).
- Money = integer cents internally; `decimal` columns store dollar strings via `toDollars()`.
- Run unit tests `npm test`; typecheck `npx tsc --noEmit` (ignore the ESM ExperimentalWarning lines) — **run tsc after every task**; build `npm run build` at checkpoints.
- Migrations: update `src/db/schema.ts`, then apply SQL via Supabase MCP `apply_migration` (same as 0000–0003).
- Auth: handlers call `requireRole([...])` from `@/lib/auth/session`; catch `AuthError` → 403.

---

## File map

**Created:**
- `src/lib/orders/status.ts` + `status.test.ts` — state machines
- `src/lib/orders/place-order.ts` — shared dispatch+persist (extracted from the public route)
- `src/app/api/admin/orders/route.ts` — GET list (lanes) + POST manual order
- `src/app/api/admin/orders/[id]/route.ts` — PATCH status
- `src/app/api/admin/orders/[id]/payment/route.ts` — PATCH payment
- `src/components/admin/orders-board.tsx` — client board (polling, lanes, alerts)
- `src/components/admin/order-card.tsx` — single order card + actions
- `src/components/admin/manual-order-form.tsx` — phone/walk-in order form

**Modified:**
- `src/db/schema.ts` — add 3 `orders` columns
- `src/lib/orders/create-order.ts` — accept `source`, `paymentStatus`, `paymentMethod`
- `src/app/api/orders/route.ts` — call shared `placeOrder()`
- `src/lib/doordash/webhook.ts` — add delivery→order status mapping
- `src/app/api/doordash/webhook/route.ts` — apply mapping via `canTransition`
- `src/app/admin/(panel)/page.tsx` — render `<OrdersBoard/>`

**Deleted:**
- `src/app/admin/dashboard.tsx` (replaced by orders-board)
- `src/lib/preview-order.ts` (legacy localStorage; only the dashboard used it — confirm in Task 10)

---

## Task 1: Migration 0004 — payment + source columns

**Files:** Modify `src/db/schema.ts`; apply migration via MCP.

- [ ] **Step 1:** In `src/db/schema.ts`, in the `orders` table, after the `status: text("status").default("received"),` line add:
```ts
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid | paid | refunded
  paymentMethod: text("payment_method"), // cash | card | online
  source: text("source").notNull().default("online"), // online | phone
```

- [ ] **Step 2:** Apply via MCP `mcp__supabase__apply_migration`, project `zfnhcuvgvnflduqeiyin`, name `0004_order_payment_source`, SQL:
```sql
ALTER TABLE "orders" ADD COLUMN "payment_status" text DEFAULT 'unpaid' NOT NULL;
ALTER TABLE "orders" ADD COLUMN "payment_method" text;
ALTER TABLE "orders" ADD COLUMN "source" text DEFAULT 'online' NOT NULL;
```
(Load the tool first with ToolSearch `select:mcp__supabase__apply_migration` if needed.)

- [ ] **Step 3:** Verify: MCP `mcp__supabase__execute_sql` → `select payment_status, payment_method, source from orders limit 1;` returns without error (0 rows OK).

- [ ] **Step 4:** `npx tsc --noEmit` → 0 errors.

- [ ] **Step 5:** Commit:
```bash
git add src/db/schema.ts drizzle/migrations
git commit -m "feat(db): orders payment_status/payment_method/source (0004)"
```

---

## Task 2: Status state machines (TDD)

**Files:** Create `src/lib/orders/status.ts`, `src/lib/orders/status.test.ts`.

- [ ] **Step 1:** Write `src/lib/orders/status.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { nextStatuses, canTransition } from "@/lib/orders/status";

describe("nextStatuses (staff buttons)", () => {
  it("pickup received -> [preparing, cancelled]", () => {
    expect(nextStatuses("pickup", "received")).toEqual(["preparing", "cancelled"]);
  });
  it("pickup ready -> [completed, cancelled]", () => {
    expect(nextStatuses("pickup", "ready")).toEqual(["completed", "cancelled"]);
  });
  it("delivery ready -> only [cancelled] (courier states are webhook-driven)", () => {
    expect(nextStatuses("delivery", "ready")).toEqual(["cancelled"]);
  });
  it("terminal -> []", () => {
    expect(nextStatuses("pickup", "completed")).toEqual([]);
    expect(nextStatuses("delivery", "delivered")).toEqual([]);
    expect(nextStatuses("pickup", "cancelled")).toEqual([]);
  });
});

describe("canTransition", () => {
  it("staff advances pickup one step forward", () => {
    expect(canTransition("pickup", "received", "preparing", "staff")).toBe(true);
    expect(canTransition("pickup", "ready", "completed", "staff")).toBe(true);
  });
  it("staff cannot skip or go backward", () => {
    expect(canTransition("pickup", "received", "ready", "staff")).toBe(false);
    expect(canTransition("pickup", "ready", "preparing", "staff")).toBe(false);
  });
  it("staff cannot set delivery courier states", () => {
    expect(canTransition("delivery", "ready", "courier_picked_up", "staff")).toBe(false);
  });
  it("staff may cancel any non-terminal", () => {
    expect(canTransition("pickup", "preparing", "cancelled", "staff")).toBe(true);
    expect(canTransition("delivery", "received", "cancelled", "staff")).toBe(true);
  });
  it("cannot transition out of a terminal state", () => {
    expect(canTransition("pickup", "completed", "cancelled", "staff")).toBe(false);
    expect(canTransition("delivery", "delivered", "en_route", "webhook")).toBe(false);
  });
  it("webhook may jump forward through delivery courier states (events can skip)", () => {
    expect(canTransition("delivery", "ready", "courier_picked_up", "webhook")).toBe(true);
    expect(canTransition("delivery", "ready", "delivered", "webhook")).toBe(true);
    expect(canTransition("delivery", "courier_picked_up", "en_route", "webhook")).toBe(true);
  });
  it("webhook cannot move pickup orders or go backward", () => {
    expect(canTransition("pickup", "received", "courier_picked_up", "webhook")).toBe(false);
    expect(canTransition("delivery", "en_route", "ready", "webhook")).toBe(false);
  });
});
```

- [ ] **Step 2:** Run `npm test -- status` → FAIL.

- [ ] **Step 3:** Implement `src/lib/orders/status.ts`:
```ts
export type Fulfillment = "pickup" | "delivery";
export type Actor = "staff" | "webhook";

export const PICKUP_FLOW = ["received", "preparing", "ready", "completed"] as const;
export const DELIVERY_FLOW = [
  "received", "preparing", "ready", "courier_picked_up", "en_route", "delivered",
] as const;
export const TERMINAL = new Set<string>(["completed", "delivered", "cancelled"]);

// Highest flow index a staff member may advance to (delivery's courier+ states are webhook-only).
const STAFF_MAX_INDEX: Record<Fulfillment, number> = { pickup: 3, delivery: 2 };

function flow(f: Fulfillment): readonly string[] {
  return f === "pickup" ? PICKUP_FLOW : DELIVERY_FLOW;
}

/** Staff-advanceable next states for the dashboard buttons (forward one step + cancel). */
export function nextStatuses(f: Fulfillment, current: string): string[] {
  if (TERMINAL.has(current)) return [];
  const fl = flow(f);
  const i = fl.indexOf(current);
  const out: string[] = [];
  if (i >= 0 && i < STAFF_MAX_INDEX[f] && i + 1 < fl.length) {
    const nxt = fl[i + 1];
    if (nxt) out.push(nxt);
  }
  out.push("cancelled");
  return out;
}

export function canTransition(f: Fulfillment, from: string, to: string, actor: Actor): boolean {
  if (from === to) return false;
  if (TERMINAL.has(from)) return false;
  if (to === "cancelled") return true; // either actor may cancel a non-terminal order
  const fl = flow(f);
  const fi = fl.indexOf(from);
  const ti = fl.indexOf(to);
  if (fi < 0 || ti < 0) return false;
  if (ti <= fi) return false; // forward only
  if (actor === "staff") return ti === fi + 1 && ti <= STAFF_MAX_INDEX[f];
  // webhook: delivery only, target must be a courier/delivered state; may skip intermediate events
  if (f !== "delivery") return false;
  return ti >= 3;
}
```

- [ ] **Step 4:** Run `npm test -- status` → all pass.
- [ ] **Step 5:** `npx tsc --noEmit` → 0 errors.
- [ ] **Step 6:** Commit:
```bash
git add src/lib/orders/status.ts src/lib/orders/status.test.ts
git commit -m "feat(orders): pickup/delivery status state machines"
```

---

## Task 3: Webhook delivery→order status mapping (TDD)

**Files:** Modify `src/lib/doordash/webhook.ts`; modify `src/app/api/doordash/webhook/route.ts`; test `src/lib/doordash/webhook.test.ts`.

- [ ] **Step 1:** Write `src/lib/doordash/webhook.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mapDeliveryStatus } from "@/lib/doordash/webhook";

describe("mapDeliveryStatus", () => {
  it("maps pickup-side events to courier_picked_up", () => {
    for (const s of ["enroute_to_pickup", "arrived_at_pickup", "picked_up"]) {
      expect(mapDeliveryStatus(s)).toBe("courier_picked_up");
    }
  });
  it("maps dropoff-enroute events to en_route", () => {
    for (const s of ["enroute_to_dropoff", "arrived_at_dropoff"]) {
      expect(mapDeliveryStatus(s)).toBe("en_route");
    }
  });
  it("maps delivered and cancelled", () => {
    expect(mapDeliveryStatus("delivered")).toBe("delivered");
    expect(mapDeliveryStatus("cancelled")).toBe("cancelled");
  });
  it("returns null for unmapped/early statuses", () => {
    expect(mapDeliveryStatus("created")).toBeNull();
    expect(mapDeliveryStatus("confirmed")).toBeNull();
    expect(mapDeliveryStatus("nonsense")).toBeNull();
  });
});
```

- [ ] **Step 2:** Run `npm test -- webhook` → FAIL.

- [ ] **Step 3:** In `src/lib/doordash/webhook.ts`, REPLACE the `TERMINAL_STATUS` export (lines ~55-59) with:
```ts
// Maps a DoorDash delivery_status to the order status it should drive (delivery flow).
// Early statuses (created/confirmed) intentionally map to null (no order-status change).
const DELIVERY_TO_ORDER: Record<string, string> = {
  enroute_to_pickup: "courier_picked_up",
  arrived_at_pickup: "courier_picked_up",
  picked_up: "courier_picked_up",
  enroute_to_dropoff: "en_route",
  arrived_at_dropoff: "en_route",
  delivered: "delivered",
  cancelled: "cancelled",
};

export function mapDeliveryStatus(deliveryStatus: string | null): string | null {
  if (!deliveryStatus) return null;
  return DELIVERY_TO_ORDER[deliveryStatus] ?? null;
}
```

- [ ] **Step 4:** Run `npm test -- webhook` → all pass.

- [ ] **Step 5:** Update `src/app/api/doordash/webhook/route.ts` to use the new mapping + `canTransition`. Change the imports (lines 3-9) to:
```ts
import { db } from "@/db";
import { deliveries, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  verifyWebhookSignature,
  parseEvent,
  mapDeliveryStatus,
} from "@/lib/doordash/webhook";
import { canTransition } from "@/lib/orders/status";
```
(Removed `notInArray` and `TERMINAL_STATUS`.)

Change the `existing` select to also fetch the order's current status + type. Replace the select block (lines 31-39) with:
```ts
  const [existing] = await db
    .select({
      orderId: deliveries.orderId,
      lastEventId: deliveries.lastEventId,
      orderStatus: orders.status,
      orderType: orders.orderType,
    })
    .from(deliveries)
    .innerJoin(orders, eq(orders.id, deliveries.orderId))
    .where(eq(deliveries.externalDeliveryId, evt.externalDeliveryId))
    .limit(1);
```

Replace the order-status update block (lines 55-65) with:
```ts
  const mapped = mapDeliveryStatus(evt.status);
  if (
    mapped &&
    existing.orderType === "delivery" &&
    canTransition("delivery", existing.orderStatus ?? "received", mapped, "webhook")
  ) {
    await db
      .update(orders)
      .set({ status: mapped, updatedAt: new Date() })
      .where(eq(orders.id, existing.orderId));
  }
```

- [ ] **Step 6:** `npx tsc --noEmit` → 0 errors. Run `npm test` → all green.

- [ ] **Step 7:** Commit:
```bash
git add src/lib/doordash/webhook.ts src/app/api/doordash/webhook/route.ts src/lib/doordash/webhook.test.ts
git commit -m "feat(doordash): map delivery events to order status via state machine"
```

---

## Task 4: Extend createOrder for source + payment

**Files:** Modify `src/lib/orders/create-order.ts`.

- [ ] **Step 1:** In `NewOrderInput` (after `deliveryFeeCents?: number;`) add:
```ts
  source?: "online" | "phone";
  paymentStatus?: "unpaid" | "paid" | "refunded";
  paymentMethod?: "cash" | "card" | "online" | null;
```

- [ ] **Step 2:** In the `tx.insert(orders).values({...})` object, after `status: "received",` add:
```ts
        source: input.source ?? "online",
        paymentStatus: input.paymentStatus ?? "unpaid",
        paymentMethod: input.paymentMethod ?? null,
```

- [ ] **Step 3:** `npx tsc --noEmit` → 0 errors. `npm test` → green.

- [ ] **Step 4:** Commit:
```bash
git add src/lib/orders/create-order.ts
git commit -m "feat(orders): createOrder accepts source + payment fields"
```

---

## Task 5: Extract shared `placeOrder()` and repoint the public route

This refactor must keep the **customer** `POST /api/orders` behavior identical.

**Files:** Create `src/lib/orders/place-order.ts`; modify `src/app/api/orders/route.ts`.

- [ ] **Step 1:** Create `src/lib/orders/place-order.ts`:
```ts
import { db } from "@/db";
import { deliveries } from "@/db/schema";
import { createOrder } from "@/lib/orders/create-order";
import { acceptQuote } from "@/lib/doordash/client";
import {
  priceOrder, validateContact, cleanString,
  isValidExternalDeliveryId, httpsUrlOrNull, PricingError,
} from "@/lib/orders/pricing";
import { getSettings } from "@/lib/settings";
import { computeDeliveryFee, assertDeliverable, MinOrderError } from "@/lib/orders/delivery-pricing";

export class OrderError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "OrderError";
  }
}

export interface PlaceOrderInput {
  name: unknown; phone: unknown; email: unknown;
  fulfillment: "pickup" | "delivery";
  address?: unknown;
  items: { id: unknown; qty: unknown }[];
  tipCents: number;
  externalDeliveryId?: unknown;
  source?: "online" | "phone";
  paymentStatus?: "unpaid" | "paid" | "refunded";
  paymentMethod?: "cash" | "card" | "online" | null;
}

/**
 * Validates, dispatches a DoorDash driver for delivery, persists the order, and
 * records the delivery row. Throws OrderError(message,status) for caller→HTTP mapping.
 * Behavior matches the original POST /api/orders flow exactly.
 */
export async function placeOrder(
  input: PlaceOrderInput,
): Promise<{ orderId: string; accessToken: string }> {
  const settings = await getSettings();
  if (settings.ordering_paused) {
    throw new OrderError("Online ordering is paused. Please call the restaurant.", 503);
  }
  if (input.fulfillment === "delivery" && !settings.delivery_enabled) {
    throw new OrderError("Delivery is currently unavailable.", 503);
  }
  if (input.fulfillment === "pickup" && !settings.pickup_enabled) {
    throw new OrderError("Pickup is currently unavailable.", 503);
  }

  // 1) Validate contact + items before any external dispatch.
  try {
    validateContact(input);
    priceOrder(input.items, { tipCents: input.tipCents });
    if (input.fulfillment === "delivery" && !cleanString(input.address, 200)) {
      throw new OrderError("Delivery address is required", 400);
    }
  } catch (e) {
    if (e instanceof OrderError) throw e;
    throw new OrderError(e instanceof PricingError ? e.message : "Invalid order", 400);
  }

  // 2) Delivery: accept the server-issued quote → authoritative fee + admin config.
  let accepted: Awaited<ReturnType<typeof acceptQuote>> | null = null;
  let deliveryFeeCents = 0;
  if (input.fulfillment === "delivery") {
    if (!isValidExternalDeliveryId(input.externalDeliveryId)) {
      throw new OrderError("Invalid delivery reference", 400);
    }
    const subtotalCents = priceOrder(input.items).subtotalCents;
    try {
      assertDeliverable({ subtotalCents }, settings.delivery);
    } catch (e) {
      if (e instanceof MinOrderError) {
        throw new OrderError(`Delivery minimum is $${(e.minOrderCents / 100).toFixed(2)}.`, 400);
      }
      throw e;
    }
    try {
      accepted = await acceptQuote(input.externalDeliveryId as string);
    } catch (e) {
      console.error("[placeOrder] Drive acceptQuote failed:", e);
      throw new OrderError("Could not arrange delivery right now. Please try again.", 502);
    }
    deliveryFeeCents = computeDeliveryFee(
      { doordashFeeCents: accepted.feeCents ?? 0, subtotalCents },
      settings.delivery,
    ).feeCents;
  }

  // 3) Persist (createOrder recomputes money server-side incl. DB tax).
  let result: { orderId: string; accessToken: string };
  try {
    result = await createOrder({
      name: input.name, phone: input.phone, email: input.email,
      fulfillment: input.fulfillment, address: input.address,
      items: input.items, tipCents: input.tipCents, deliveryFeeCents,
      source: input.source, paymentStatus: input.paymentStatus, paymentMethod: input.paymentMethod,
    });
  } catch (e) {
    if (accepted) {
      console.error("[placeOrder] persist failed AFTER dispatch; orphaned delivery:", accepted.externalDeliveryId, e);
    } else {
      console.error("[placeOrder] persist failed:", e);
    }
    throw new OrderError(e instanceof PricingError ? e.message : "Could not place order", 400);
  }

  // 4) Record the delivery row (non-fatal).
  if (accepted) {
    try {
      await db.insert(deliveries).values({
        orderId: result.orderId,
        externalDeliveryId: accepted.externalDeliveryId,
        status: accepted.status,
        feeCents: accepted.feeCents,
        trackingUrl: httpsUrlOrNull(accepted.trackingUrl),
        dropoffAddress: cleanString(input.address, 200),
      });
    } catch (e) {
      console.error("[placeOrder] delivery row insert failed for order", result.orderId, e);
    }
  }

  return result;
}
```

- [ ] **Step 2:** Replace `src/app/api/orders/route.ts` ENTIRELY with the thin version:
```ts
import { NextResponse } from "next/server";
import { toCents } from "@/lib/orders/money";
import { placeOrder, OrderError } from "@/lib/orders/place-order";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const fulfillment = body?.fulfillment === "delivery" ? "delivery" : "pickup";
  try {
    const { orderId, accessToken } = await placeOrder({
      name: body.name, phone: body.phone, email: body.email,
      fulfillment,
      address: body.address,
      items: (body?.items as { id: unknown; qty: unknown }[]) ?? [],
      tipCents: toCents(Number(body?.tip) || 0),
      externalDeliveryId: body.externalDeliveryId,
      source: "online",
    });
    return NextResponse.json({ orderId, accessToken });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[orders] unexpected:", e);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
```

- [ ] **Step 3:** `npx tsc --noEmit` → 0 errors. `npm test` → green.

- [ ] **Step 4:** Regression-verify the customer flow is intact: `npm run build` succeeds; the `/api/orders` route still compiles. (Behavioral parity: same validation order, same 400/502/503 messages, same `{orderId, accessToken}` response.)

- [ ] **Step 5:** Commit:
```bash
git add src/lib/orders/place-order.ts src/app/api/orders/route.ts
git commit -m "refactor(orders): extract shared placeOrder() reused by public route"
```

---

## Task 6: GET /api/admin/orders (lanes)

**Files:** Create `src/app/api/admin/orders/route.ts`.

- [ ] **Step 1:** Create `src/app/api/admin/orders/route.ts`:
```ts
import { NextResponse } from "next/server";
import { desc, inArray, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, deliveries } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

const LANES: Record<string, string[]> = {
  active: ["received", "preparing", "ready", "courier_picked_up", "en_route"],
  completed: ["completed", "delivered"],
  cancelled: ["cancelled"],
};

export async function GET(req: Request) {
  try {
    await requireRole(["owner", "manager", "staff"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const lane = new URL(req.url).searchParams.get("lane") ?? "active";
  const statuses = LANES[lane] ?? LANES.active;

  const rows = await db
    .select()
    .from(orders)
    .where(inArray(orders.status, statuses))
    .orderBy(desc(orders.createdAt))
    .limit(200);

  const ids = rows.map((o) => o.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];
  const dels = ids.length
    ? await db.select().from(deliveries).where(inArray(deliveries.orderId, ids))
    : [];

  const result = rows.map((o) => ({
    ...o,
    items: items.filter((i) => i.orderId === o.id),
    delivery: dels.find((d) => d.orderId === o.id) ?? null,
  }));

  return NextResponse.json({ orders: result });
}
```
> Note: `eq` import is kept for parity with sibling routes even if unused-pruned; if lint flags it as unused, remove `eq` from the import.

- [ ] **Step 2:** `npx tsc --noEmit` → 0 errors (remove `eq` if flagged unused).
- [ ] **Step 3:** Commit:
```bash
git add src/app/api/admin/orders/route.ts
git commit -m "feat(admin): GET /api/admin/orders by lane"
```

---

## Task 7: PATCH /api/admin/orders/[id] — status transition

**Files:** Create `src/app/api/admin/orders/[id]/route.ts`.

- [ ] **Step 1:** Create `src/app/api/admin/orders/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";
import { canTransition, type Fulfillment } from "@/lib/orders/status";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["owner", "manager", "staff"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const to = typeof body.status === "string" ? body.status : "";

  const [order] = await db
    .select({ status: orders.status, orderType: orders.orderType })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const fulfillment: Fulfillment = order.orderType === "delivery" ? "delivery" : "pickup";
  if (!canTransition(fulfillment, order.status ?? "received", to, "staff")) {
    return NextResponse.json({ error: "Invalid status change" }, { status: 409 });
  }

  await db.update(orders).set({ status: to, updatedAt: new Date() }).where(eq(orders.id, id));
  return NextResponse.json({ ok: true, status: to });
}
```

- [ ] **Step 2:** `npx tsc --noEmit` → 0 errors. (Next 16 route handler `params` is a Promise — the `await params` above is correct.)
- [ ] **Step 3:** Commit:
```bash
git add "src/app/api/admin/orders/[id]/route.ts"
git commit -m "feat(admin): PATCH order status (transition-validated)"
```

---

## Task 8: PATCH /api/admin/orders/[id]/payment

**Files:** Create `src/app/api/admin/orders/[id]/payment/route.ts`.

- [ ] **Step 1:** Create `src/app/api/admin/orders/[id]/payment/route.ts`:
```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

const PAYMENT_STATUSES = new Set(["unpaid", "paid", "refunded"]);
const PAYMENT_METHODS = new Set(["cash", "card", "online"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["owner", "manager", "staff"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const set: { paymentStatus?: string; paymentMethod?: string | null; updatedAt: Date } = { updatedAt: new Date() };
  if ("payment_status" in body) {
    if (!PAYMENT_STATUSES.has(String(body.payment_status))) {
      return NextResponse.json({ error: "Invalid payment_status" }, { status: 400 });
    }
    set.paymentStatus = String(body.payment_status);
  }
  if ("payment_method" in body) {
    const m = body.payment_method;
    if (m !== null && !PAYMENT_METHODS.has(String(m))) {
      return NextResponse.json({ error: "Invalid payment_method" }, { status: 400 });
    }
    set.paymentMethod = m === null ? null : String(m);
  }

  const [updated] = await db.update(orders).set(set).where(eq(orders.id, id)).returning({ id: orders.id });
  if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2:** `npx tsc --noEmit` → 0 errors.
- [ ] **Step 3:** Commit:
```bash
git add "src/app/api/admin/orders/[id]/payment/route.ts"
git commit -m "feat(admin): PATCH order payment status/method"
```

---

## Task 9: POST /api/admin/orders — manual order

**Files:** Modify `src/app/api/admin/orders/route.ts` (add POST).

- [ ] **Step 1:** Append a `POST` handler to `src/app/api/admin/orders/route.ts`. Add imports at top:
```ts
import { toCents } from "@/lib/orders/money";
import { placeOrder, OrderError } from "@/lib/orders/place-order";
```
Then add:
```ts
export async function POST(req: Request) {
  try {
    await requireRole(["owner", "manager", "staff"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const fulfillment = body?.fulfillment === "delivery" ? "delivery" : "pickup";
  const payMethodRaw = body?.payment_method;
  const paymentMethod =
    payMethodRaw === "cash" || payMethodRaw === "card" || payMethodRaw === "online" ? payMethodRaw : null;
  const paymentStatus = body?.payment_status === "paid" ? "paid" : "unpaid";

  try {
    const { orderId } = await placeOrder({
      name: body.name, phone: body.phone, email: body.email,
      fulfillment,
      address: body.address,
      items: (body?.items as { id: unknown; qty: unknown }[]) ?? [],
      tipCents: toCents(Number(body?.tip) || 0),
      externalDeliveryId: body.externalDeliveryId,
      source: "phone",
      paymentStatus,
      paymentMethod,
    });
    return NextResponse.json({ orderId });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[admin orders] unexpected:", e);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
```

- [ ] **Step 2:** `npx tsc --noEmit` → 0 errors. `npm test` → green.
- [ ] **Step 3:** Commit:
```bash
git add src/app/api/admin/orders/route.ts
git commit -m "feat(admin): POST /api/admin/orders manual/phone order"
```

---

## Task 10: Dashboard rebuild — board + card

**Files:** Create `src/components/admin/order-card.tsx`, `src/components/admin/orders-board.tsx`; modify `src/app/admin/(panel)/page.tsx`; delete `src/app/admin/dashboard.tsx` and `src/lib/preview-order.ts`.

- [ ] **Step 1:** Create `src/components/admin/order-card.tsx`:
```tsx
"use client";

import { nextStatuses, type Fulfillment } from "@/lib/orders/status";

export type AdminOrder = {
  id: string;
  orderNumber: number;
  customerName: string | null;
  customerPhone: string | null;
  orderType: string | null;
  status: string;
  source: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string | null;
  tax: string | null;
  tip: string | null;
  deliveryFee: string | null;
  total: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  items: { id: string; itemName: string | null; quantity: number | null }[];
  delivery: { trackingUrl: string | null; status: string | null } | null;
};

const LABEL: Record<string, string> = {
  received: "Received", preparing: "Preparing", ready: "Ready",
  courier_picked_up: "Courier picked up", en_route: "En route",
  completed: "Completed", delivered: "Delivered", cancelled: "Cancelled",
};

export function OrderCard({
  order, busy, onStatus, onPayment,
}: {
  order: AdminOrder;
  busy: boolean;
  onStatus: (id: string, to: string) => void;
  onPayment: (id: string, patch: { payment_status?: string; payment_method?: string }) => void;
}) {
  const fulfillment: Fulfillment = order.orderType === "delivery" ? "delivery" : "pickup";
  const actions = nextStatuses(fulfillment, order.status);
  const card: React.CSSProperties = {
    backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.18)",
    borderRadius: 14, padding: 16, marginBottom: 12,
  };
  return (
    <div style={card}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <span style={{ color: "#F3E9D6", fontWeight: 600 }}>#{order.orderNumber}</span>
          <span className="ml-2 text-xs uppercase tracking-widest" style={{ color: "#8A8276" }}>
            {fulfillment}{order.source === "phone" ? " · phone" : ""}
          </span>
        </div>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(201,162,75,0.15)", color: "#C9A24B" }}>
          {LABEL[order.status] ?? order.status}
        </span>
      </div>
      <div className="text-sm" style={{ color: "#F3E9D6" }}>{order.customerName} · {order.customerPhone}</div>
      {order.deliveryAddress && <div className="text-xs" style={{ color: "#8A8276" }}>{order.deliveryAddress}</div>}
      <ul className="my-2 text-sm" style={{ color: "#C9C2B5" }}>
        {order.items.map((i) => <li key={i.id}>{i.quantity}× {i.itemName}</li>)}
      </ul>
      <div className="text-sm mb-2" style={{ color: "#F3E9D6" }}>Total ${order.total}</div>
      {order.delivery?.trackingUrl && (
        <a href={order.delivery.trackingUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs underline" style={{ color: "#C9A24B" }}>Track delivery →</a>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {actions.map((a) => (
          <button key={a} disabled={busy} onClick={() => onStatus(order.id, a)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold disabled:opacity-50"
            style={a === "cancelled"
              ? { border: "1px solid #DC2626", color: "#FCA5A5" }
              : { backgroundColor: "#C9A24B", color: "#14100D" }}>
            {a === "cancelled" ? "Cancel" : `→ ${LABEL[a] ?? a}`}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: "#8A8276" }}>
        <span>Payment: {order.paymentStatus}{order.paymentMethod ? ` (${order.paymentMethod})` : ""}</span>
        {order.paymentStatus !== "paid" && (
          <>
            <button disabled={busy} onClick={() => onPayment(order.id, { payment_status: "paid", payment_method: "cash" })}
              className="px-2 py-1 rounded" style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}>Paid · cash</button>
            <button disabled={busy} onClick={() => onPayment(order.id, { payment_status: "paid", payment_method: "card" })}
              className="px-2 py-1 rounded" style={{ border: "1px solid rgba(201,162,75,0.3)", color: "#C9A24B" }}>Paid · card</button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Create `src/components/admin/orders-board.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OrderCard, type AdminOrder } from "./order-card";

type Lane = "active" | "completed" | "cancelled";
const SOUND_KEY = "annapurna:admin:sound";

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    osc.onended = () => ctx.close();
  } catch { /* audio not available */ }
}

export function OrdersBoard() {
  const [lane, setLane] = useState<Lane>("active");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  useEffect(() => {
    setSoundOn(localStorage.getItem(SOUND_KEY) === "on");
  }, []);

  const load = useCallback(async (l: Lane) => {
    const res = await fetch(`/api/admin/orders?lane=${l}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { orders: AdminOrder[] };
    if (l === "active") {
      const incoming = data.orders.filter((o) => o.status === "received");
      const fresh = incoming.some((o) => !seenRef.current.has(o.id));
      data.orders.forEach((o) => seenRef.current.add(o.id));
      if (fresh && !firstLoadRef.current && soundOn) beep();
      firstLoadRef.current = false;
    }
    setOrders(data.orders);
  }, [soundOn]);

  useEffect(() => {
    firstLoadRef.current = true;
    load(lane);
    const t = setInterval(() => load(lane), 10_000);
    const onFocus = () => load(lane);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [lane, load]);

  const patchStatus = async (id: string, to: string) => {
    setBusyId(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: to }),
    });
    setBusyId(null);
    load(lane);
  };
  const patchPayment = async (id: string, patch: { payment_status?: string; payment_method?: string }) => {
    setBusyId(id);
    await fetch(`/api/admin/orders/${id}/payment`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    setBusyId(null);
    load(lane);
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    if (next) beep(); // unlock audio on the user gesture
  };

  const tab = (l: Lane, label: string) => (
    <button onClick={() => setLane(l)}
      className="px-4 py-2 rounded-full text-sm font-semibold"
      style={l === lane ? { backgroundColor: "#C9A24B", color: "#14100D" } : { color: "#8A8276" }}>
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">{tab("active", "Active")}{tab("completed", "Completed")}{tab("cancelled", "Cancelled")}</div>
        <button onClick={toggleSound} className="text-xs px-3 py-1.5 rounded-full"
          style={{ border: "1px solid rgba(201,162,75,0.3)", color: soundOn ? "#C9A24B" : "#8A8276" }}>
          {soundOn ? "🔔 Sound on" : "🔕 Sound off"}
        </button>
      </div>
      {orders.length === 0 && <p style={{ color: "#8A8276" }}>No orders in this lane.</p>}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} busy={busyId === o.id} onStatus={patchStatus} onPayment={patchPayment} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3:** Replace `src/app/admin/(panel)/page.tsx` with:
```tsx
import { OrdersBoard } from "@/components/admin/orders-board";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  return <OrdersBoard />;
}
```

- [ ] **Step 4:** Delete legacy files (confirm nothing else imports `preview-order`):
```bash
grep -rn "preview-order\|from \"./dashboard\"\|admin/dashboard" src/ | grep -v node_modules
```
If only `dashboard.tsx` referenced `preview-order` and nothing imports `dashboard` except the old page (now replaced), delete both:
```bash
git rm src/app/admin/dashboard.tsx src/lib/preview-order.ts
```
If `preview-order` IS imported elsewhere, leave it and report that in the commit body.

- [ ] **Step 5:** `npx tsc --noEmit` → 0 errors. `npm run build` → succeeds; `/admin` route compiles.

- [ ] **Step 6:** Commit:
```bash
git add -A
git commit -m "feat(admin): DB-backed orders board (polling, lanes, status/payment, sound alert)"
```

---

## Task 11: Manual order form

**Files:** Create `src/components/admin/manual-order-form.tsx`; wire a toggle into `orders-board.tsx`.

- [ ] **Step 1:** Create `src/components/admin/manual-order-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { menu } from "@/data/menu";

type Line = { id: string; qty: number };

export function ManualOrderForm({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState<"cash" | "card">("cash");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addLine = (id: string) =>
    setLines((p) => p.find((l) => l.id === id) ? p.map((l) => l.id === id ? { ...l, qty: l.qty + 1 } : l) : [...p, { id, qty: 1 }]);
  const setQty = (id: string, qty: number) =>
    setLines((p) => p.flatMap((l) => l.id === id ? (qty > 0 ? [{ ...l, qty }] : []) : [l]));

  async function submit() {
    setErr(null);
    setSubmitting(true);
    try {
      let externalDeliveryId: string | undefined;
      if (fulfillment === "delivery") {
        const q = await fetch("/api/delivery/quote", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, phone, items: lines }),
        });
        const qd = await q.json();
        if (!q.ok) throw new Error(qd.error ?? "Quote failed");
        externalDeliveryId = qd.externalDeliveryId;
      }
      const res = await fetch("/api/admin/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, email: "", fulfillment, address, items: lines,
          externalDeliveryId,
          payment_status: paid ? "paid" : "unpaid",
          payment_method: paid ? method : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create order");
      onCreated();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  const input = "w-full rounded-lg px-3 py-2 mb-2";
  const inputStyle: React.CSSProperties = { backgroundColor: "#14100D", border: "1px solid rgba(201,162,75,0.2)", color: "#F3E9D6" };

  return (
    <div style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.25)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div className="flex justify-between mb-3">
        <h2 style={{ color: "#F3E9D6" }}>New phone / walk-in order</h2>
        <button onClick={onClose} style={{ color: "#8A8276" }}>✕</button>
      </div>
      {err && <p className="mb-2 text-sm" style={{ color: "#FCA5A5" }}>{err}</p>}
      <input className={input} style={inputStyle} placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={input} style={inputStyle} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <div className="flex gap-2 mb-2">
        {(["pickup", "delivery"] as const).map((f) => (
          <button key={f} onClick={() => setFulfillment(f)} className="px-3 py-1.5 rounded-full text-sm"
            style={f === fulfillment ? { backgroundColor: "#C9A24B", color: "#14100D" } : { color: "#8A8276", border: "1px solid rgba(201,162,75,0.3)" }}>
            {f}
          </button>
        ))}
      </div>
      {fulfillment === "delivery" && (
        <input className={input} style={inputStyle} placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
      )}
      <select className={input} style={inputStyle} value="" onChange={(e) => e.target.value && addLine(e.target.value)}>
        <option value="">+ Add item…</option>
        {menu.filter((m) => !m.isCatering).map((m) => <option key={m.id} value={m.id}>{m.name} — ${m.price.toFixed(2)}</option>)}
      </select>
      <ul className="my-2">
        {lines.map((l) => {
          const item = menu.find((m) => m.id === l.id);
          return (
            <li key={l.id} className="flex items-center gap-2 text-sm" style={{ color: "#F3E9D6" }}>
              <span className="flex-1">{item?.name}</span>
              <input type="number" min={0} value={l.qty} onChange={(e) => setQty(l.id, Number(e.target.value))}
                className="w-16 rounded px-2 py-1" style={inputStyle} />
            </li>
          );
        })}
      </ul>
      <label className="flex items-center gap-2 text-sm mb-2" style={{ color: "#F3E9D6" }}>
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Mark paid
        {paid && (
          <select value={method} onChange={(e) => setMethod(e.target.value as "cash" | "card")} className="rounded px-2 py-1" style={inputStyle}>
            <option value="cash">cash</option><option value="card">card</option>
          </select>
        )}
      </label>
      <button disabled={submitting || lines.length === 0 || !name || !phone || (fulfillment === "delivery" && !address)}
        onClick={submit} className="px-5 py-2.5 rounded-full font-bold disabled:opacity-50"
        style={{ backgroundColor: "#C9A24B", color: "#14100D" }}>
        {submitting ? "Creating…" : fulfillment === "delivery" ? "Quote + dispatch delivery" : "Create order"}
      </button>
      {fulfillment === "delivery" && <p className="text-xs mt-2" style={{ color: "#8A8276" }}>Creating a delivery order books a DoorDash driver immediately.</p>}
    </div>
  );
}
```

- [ ] **Step 2:** Wire it into `orders-board.tsx`: add `import { ManualOrderForm } from "./manual-order-form";`, a `const [showForm, setShowForm] = useState(false);`, a "New order" button next to the sound toggle (`<button onClick={() => setShowForm(true)} ...>+ New order</button>`), and render `{showForm && <ManualOrderForm onCreated={() => load(lane)} onClose={() => setShowForm(false)} />}` above the list.

- [ ] **Step 3:** `npx tsc --noEmit` → 0 errors. `npm run build` → succeeds.

- [ ] **Step 4:** Commit:
```bash
git add src/components/admin/manual-order-form.tsx src/components/admin/orders-board.tsx
git commit -m "feat(admin): manual phone/walk-in order form"
```

---

## Task 12: Final verification

- [ ] **Step 1:** `npm test` → all green (status, webhook, plus prior suites).
- [ ] **Step 2:** `npm run build` → success; confirm routes `/admin`, `ƒ /api/admin/orders`, `ƒ /api/admin/orders/[id]`, `ƒ /api/admin/orders/[id]/payment`.
- [ ] **Step 3:** `npx tsc --noEmit` → 0 errors.
- [ ] **Step 4:** Manual E2E (start `PORT=3xxx npm run start`, mint an owner cookie as in P0 verification):
  - Place a customer pickup order via `POST /api/orders` → `GET /api/admin/orders?lane=active` (with cookie) shows it as `received`.
  - `PATCH /api/admin/orders/{id}` `{status:"preparing"}` → 200; `{status:"completed"}` from `received` → 409 (skip blocked).
  - `PATCH .../{id}/payment` `{payment_status:"paid",payment_method:"cash"}` → 200.
  - `POST /api/admin/orders` (cookie) pickup manual order → appears with `source:"phone"`.
  - Set `ordering_paused` (P1 settings) → manual `POST /api/admin/orders` returns 503.
- [ ] **Step 5:** Reset any settings toggled during testing. Commit any fixes.

---

## Self-review (reconciled vs spec)

- **§4 migration 0004** → Task 1. **§5 state machines** → Task 2. **§6 webhook mapping** → Task 3. **§7 APIs**: GET/POST → Tasks 6/9, PATCH status → Task 7, PATCH payment → Task 8, shared `placeOrder` → Task 5 (+ createOrder source/payment in Task 4). **§8 dashboard** → Tasks 10/11 (polling, lanes, alerts, manual form, drops localStorage). **§9 testing** → Tasks 2,3 unit + Task 12 manual. ✅
- **Type consistency:** `Fulfillment`/`Actor`, `canTransition`/`nextStatuses` (Task 2) used identically in Tasks 3/7/10. `OrderError(status)` (Task 5) mapped to HTTP in Tasks 5/9. `AdminOrder` shape (Task 10) matches the GET response (Task 6: `orders` row spread + `items` + `delivery`). Drizzle camelCase fields (`paymentStatus`, `orderType`, `orderNumber`) match schema (Task 1). ✅
- **No placeholders:** every step has full code. The two large UI components are complete. ✅
- **Deviations from spec:** none material. Spec said `placeOrder` could live in create-order.ts or a new file — chose a new `src/lib/orders/place-order.ts` for a clean boundary.
