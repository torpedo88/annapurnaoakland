import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { deliveries, menuItems, orders } from "@/db/schema";
import { createOrder } from "@/lib/orders/create-order";
import { acceptQuote, quoteDelivery } from "@/lib/doordash/client";
import {
  priceOrder, validateContact, cleanString,
  isValidExternalDeliveryId, httpsUrlOrNull, PricingError,
} from "@/lib/orders/pricing";
import { validatePromo, redeemPromo } from "@/lib/orders/promo";
import { getSettings, type Settings } from "@/lib/settings";
import { computeDeliveryFee, assertDeliverable, MinOrderError } from "@/lib/orders/delivery-pricing";
import { after } from "next/server";
import { sendOrderNotifications } from "@/lib/notify";

export class OrderError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "OrderError";
  }
}

export interface PlaceOrderInput {
  name: unknown; firstName?: unknown; lastName?: unknown; phone: unknown; email: unknown;
  fulfillment: "pickup" | "delivery";
  address?: unknown;
  items: { id: unknown; qty: unknown; spiceLevel?: unknown }[];
  tipCents: number;
  externalDeliveryId?: unknown;
  source?: "online" | "phone";
  paymentStatus?: "unpaid" | "paid" | "refunded";
  paymentMethod?: "cash" | "card" | "online" | null;
  promoCode?: unknown;
}

async function resolveDiscount(
  input: PlaceOrderInput,
  settings: Settings,
): Promise<{ discountCents: number; promoCode: string | null }> {
  const totals = priceOrder(input.items);
  let discountCents = 0;
  let promoCode: string | null = null;

  // Promo code (validated server-side against the recomputed subtotal).
  if (input.promoCode) {
    const r = await validatePromo(input.promoCode, totals.subtotalCents);
    if (r.ok) {
      discountCents += r.discountCents;
      promoCode = r.code;
    }
  }

  // Dish of the Day: % off that featured item's line, so the price advertised on
  // the homepage is actually honored. Stacks with a promo code.
  const dod = settings.dish_of_day;
  if (dod?.itemId && dod.discountPercent > 0) {
    const line = totals.lines.find((l) => l.id === dod.itemId);
    if (line) discountCents += Math.round((line.priceCents * line.qty * dod.discountPercent) / 100);
  }

  discountCents = Math.min(discountCents, totals.subtotalCents);
  return { discountCents, promoCode };
}

/**
 * Validates, dispatches a DoorDash driver for delivery, persists the order, and
 * records the delivery row. Throws OrderError(message,status) for caller->HTTP mapping.
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

  // 1b) Reject items an admin has marked unavailable ("86"). Availability is
  // DB-managed (menuItems.slug === the menu item id used in order lines), so it
  // must be enforced here regardless of what the client UI allowed.
  const itemIds = input.items.map((i) => String(i.id)).filter(Boolean);
  if (itemIds.length) {
    const rows = await db
      .select({ name: menuItems.name, isAvailable: menuItems.isAvailable })
      .from(menuItems)
      .where(inArray(menuItems.slug, itemIds));
    const eightySixed = rows.filter((r) => r.isAvailable === false);
    if (eightySixed.length) {
      const names = eightySixed.map((r) => r.name).join(", ");
      throw new OrderError(
        `${names} ${eightySixed.length > 1 ? "are" : "is"} currently unavailable. Please remove ${eightySixed.length > 1 ? "them" : "it"} and try again.`,
        409,
      );
    }
  }

  // 2) Delivery: accept the server-issued quote -> authoritative fee + admin config.
  let accepted: Awaited<ReturnType<typeof acceptQuote>> | null = null;
  let deliveryFeeCents = 0;
  if (input.fulfillment === "delivery") {
    const subtotalCents = priceOrder(input.items).subtotalCents;
    try {
      assertDeliverable({ subtotalCents }, settings.delivery);
    } catch (e) {
      if (e instanceof MinOrderError) {
        throw new OrderError(`Delivery minimum is $${(e.minOrderCents / 100).toFixed(2)}.`, 400);
      }
      throw e;
    }
    if (settings.delivery.dispatchMode === "self") {
      // Self-delivery: flat fee only, no DoorDash required.
      deliveryFeeCents = computeDeliveryFee(
        { doordashFeeCents: 0, subtotalCents },
        { ...settings.delivery, mode: "flat" },
      ).feeCents;
    } else {
      // DoorDash path: require a valid externalDeliveryId and accept the quote.
      if (!isValidExternalDeliveryId(input.externalDeliveryId)) {
        throw new OrderError("Invalid delivery reference", 400);
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
  }

  // 3) Resolve promo discount (server-authoritative; client amount never trusted).
  const { discountCents, promoCode: resolvedPromoCode } = await resolveDiscount(input, settings);

  // 4) Persist (createOrder recomputes money server-side incl. DB tax).
  let result: { orderId: string; accessToken: string };
  try {
    result = await createOrder({
      name: input.name, firstName: input.firstName, lastName: input.lastName,
      phone: input.phone, email: input.email,
      fulfillment: input.fulfillment, address: input.address,
      items: input.items, tipCents: input.tipCents, deliveryFeeCents,
      discountCents,
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

  // Redeem promo (best-effort; non-fatal if it fails).
  if (resolvedPromoCode) {
    try { await redeemPromo(resolvedPromoCode); } catch (e) {
      console.error("[placeOrder] redeemPromo failed (non-fatal):", e);
    }
  }

  // 5) Record the delivery row (non-fatal).
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

  // Notify customer + restaurant (best-effort; never blocks the response).
  after(() => sendOrderNotifications(result.orderId).catch((e) => console.error("[notify] placeOrder:", e)));

  return result;
}

/**
 * Online prepay path: validate, price (incl. an authoritative delivery quote),
 * and persist an order as `pending_payment`. Does NOT dispatch a driver — that
 * happens only after Stripe confirms payment (see dispatchPaidOrder).
 * Returns the order id, capability token, and the charged total in cents.
 */
export async function createPendingOrder(
  input: PlaceOrderInput,
): Promise<{ orderId: string; accessToken: string; totalCents: number; deliveryFeeCents: number; promoCode: string | null }> {
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
    const subtotalCents = priceOrder(input.items).subtotalCents;
    try { assertDeliverable({ subtotalCents }, settings.delivery); }
    catch (e) {
      if (e instanceof MinOrderError) throw new OrderError(`Delivery minimum is $${(e.minOrderCents / 100).toFixed(2)}.`, 400);
      throw e;
    }
    if (settings.delivery.dispatchMode === "self") {
      // Self-delivery: flat fee only, no DoorDash required.
      deliveryFeeCents = computeDeliveryFee(
        { doordashFeeCents: 0, subtotalCents },
        { ...settings.delivery, mode: "flat" },
      ).feeCents;
    } else {
      // DoorDash path: require a valid externalDeliveryId and re-quote.
      if (!isValidExternalDeliveryId(input.externalDeliveryId)) throw new OrderError("Invalid delivery reference", 400);
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
  }

  // Resolve promo discount server-side (client-supplied amount is never trusted).
  const { discountCents, promoCode: resolvedPromoCode } = await resolveDiscount(input, settings);

  const { orderId, accessToken } = await createOrder({
    name: input.name, firstName: input.firstName, lastName: input.lastName,
    phone: input.phone, email: input.email,
    fulfillment: input.fulfillment, address: input.address,
    items: input.items, tipCents: input.tipCents, deliveryFeeCents,
    discountCents,
    source: "online", paymentStatus: "unpaid", paymentMethod: "online",
    status: "pending_payment",
  });

  // Recompute the persisted total so the Stripe amount matches the DB exactly.
  const totals = priceOrder(input.items, { tipCents: input.tipCents, deliveryFeeCents, discountCents, taxRate: settings.tax_rate });
  return { orderId, accessToken, totalCents: totals.totalCents, deliveryFeeCents, promoCode: resolvedPromoCode };
}

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
  promoCode?: string;
}): Promise<void> {
  const [order] = await db.select().from(orders).where(eq(orders.id, args.orderId)).limit(1);
  if (!order) { console.error("[dispatchPaidOrder] order not found", args.orderId); return; }

  // Atomic, idempotent claim: flip to paid only if not already paid. Stripe can
  // deliver the same event more than once (and retries on 5xx); the losers of
  // this race get 0 rows back and exit before dispatching — no double charge,
  // no double driver.
  const claimed = await db.update(orders).set({
    paymentStatus: "paid",
    status: order.status === "pending_payment" ? "received" : order.status,
    stripePaymentIntentId: args.paymentIntentId ?? undefined,
    stripeCheckoutSessionId: args.checkoutSessionId ?? undefined,
    updatedAt: new Date(),
  }).where(and(eq(orders.id, args.orderId), ne(orders.paymentStatus, "paid"))).returning({ id: orders.id });
  if (claimed.length === 0) return; // already processed by another delivery of this event

  // Notify customer + restaurant (best-effort; never blocks the response).
  after(() => sendOrderNotifications(args.orderId).catch((e) => console.error("[notify] dispatchPaidOrder:", e)));

  // Redeem promo on confirmed payment (online path). Best-effort; non-fatal.
  if (args.promoCode) {
    try { await redeemPromo(args.promoCode); } catch (e) {
      console.error("[dispatchPaidOrder] redeemPromo failed (non-fatal):", e);
    }
  }

  if (order.orderType !== "delivery") return;

  // Self-delivery: no DoorDash dispatch needed — the paid+received claim above is sufficient.
  const settings = await getSettings();
  if (settings.delivery.dispatchMode === "self") return;

  const [existing] = await db.select({ id: deliveries.id }).from(deliveries).where(eq(deliveries.orderId, args.orderId)).limit(1);
  if (existing) return; // already dispatched

  const edi = args.externalDeliveryId;
  if (!edi || !isValidExternalDeliveryId(edi)) { console.error("[dispatchPaidOrder] missing/invalid externalDeliveryId for", args.orderId); return; }

  try {
    let accepted;
    try {
      accepted = await acceptQuote(edi);
    } catch {
      // Quote likely expired (payment took >5 min). Re-quote with the same id,
      // then accept. The customer was already charged the original delivery fee;
      // the kitchen still owes them a delivery, so we dispatch regardless and the
      // restaurant absorbs any small DoorDash fee delta. Log it so it's not silent.
      console.warn(
        "[dispatchPaidOrder] quote expired; re-quoting paid order",
        args.orderId, "charged deliveryFee=$" + (order.deliveryFee ?? "0"),
      );
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
