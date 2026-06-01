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

  // 2) Delivery: accept the server-issued quote -> authoritative fee + admin config.
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
