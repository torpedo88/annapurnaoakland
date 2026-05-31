import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { toDollars } from "@/lib/orders/money";
import {
  priceOrder,
  validateContact,
  cleanString,
  type RawLine,
} from "@/lib/orders/pricing";

export interface NewOrderInput {
  name: unknown;
  phone: unknown;
  email: unknown;
  fulfillment: "pickup" | "delivery";
  address?: unknown;
  items: RawLine[];
  tipCents?: number;
  deliveryFeeCents?: number;
}

/**
 * Persists an order. ALL money is recomputed server-side from the menu catalog
 * (client price/total fields are never trusted). Returns a high-entropy
 * accessToken the client needs to read the order back (guards IDOR).
 * Status is "received" — there is no payment step yet, so it is NOT "confirmed".
 */
export async function createOrder(
  input: NewOrderInput,
): Promise<{ orderId: string; accessToken: string }> {
  const contact = validateContact(input);
  const totals = priceOrder(input.items, {
    tipCents: input.tipCents,
    deliveryFeeCents: input.deliveryFeeCents,
  });
  const address =
    input.fulfillment === "delivery" ? cleanString(input.address, 200) : "";
  const accessToken = randomUUID();

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerName: contact.name,
        customerEmail: contact.email || null,
        customerPhone: contact.phone,
        orderType: input.fulfillment,
        status: "received",
        accessToken,
        subtotal: toDollars(totals.subtotalCents),
        tax: toDollars(totals.taxCents),
        tip: toDollars(totals.tipCents),
        deliveryFee: toDollars(totals.deliveryFeeCents),
        total: toDollars(totals.totalCents),
        deliveryAddress: address || null,
      })
      .returning({ id: orders.id });
    if (!order) throw new Error("Order insert failed");

    await tx.insert(orderItems).values(
      totals.lines.map((l) => ({
        orderId: order.id,
        itemName: l.name, // resolved from catalog, not the client payload
        itemPrice: toDollars(l.priceCents),
        quantity: l.qty,
      })),
    );
    return { orderId: order.id, accessToken };
  });
}
