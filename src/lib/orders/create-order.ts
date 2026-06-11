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
import { getPriceCatalog } from "@/lib/menu/catalog";
import { getSettings } from "@/lib/settings";

export interface NewOrderInput {
  name: unknown;
  firstName?: unknown;
  lastName?: unknown;
  phone: unknown;
  email: unknown;
  fulfillment: "pickup" | "delivery";
  address?: unknown;
  items: RawLine[];
  tipCents?: number;
  deliveryFeeCents?: number;
  discountCents?: number;
  status?: string; // defaults to "received"; online prepay uses "pending_payment"
  source?: "online" | "phone";
  paymentStatus?: "unpaid" | "paid" | "refunded";
  paymentMethod?: "cash" | "card" | "online" | null;
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
  const firstName = cleanString(input.firstName, 60) || null;
  const lastName = cleanString(input.lastName, 60) || null;
  const [settings, catalog] = await Promise.all([getSettings(), getPriceCatalog()]);
  const totals = priceOrder(input.items, {
    tipCents: input.tipCents,
    deliveryFeeCents: input.deliveryFeeCents,
    discountCents: input.discountCents,
    taxRate: settings.tax_rate,
  }, catalog);
  const address =
    input.fulfillment === "delivery" ? cleanString(input.address, 200) : "";
  const accessToken = randomUUID();

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerName: contact.name,
        firstName,
        lastName,
        customerEmail: contact.email || null,
        customerPhone: contact.phone,
        orderType: input.fulfillment,
        status: input.status ?? "received",
        source: input.source ?? "online",
        paymentStatus: input.paymentStatus ?? "unpaid",
        paymentMethod: input.paymentMethod ?? null,
        accessToken,
        subtotal: toDollars(totals.subtotalCents),
        tax: toDollars(totals.taxCents),
        tip: toDollars(totals.tipCents),
        deliveryFee: toDollars(totals.deliveryFeeCents),
        discount: toDollars(totals.discountCents),
        total: toDollars(totals.totalCents),
        deliveryAddress: address || null,
      })
      .returning({ id: orders.id });
    if (!order) throw new Error("Order insert failed");

    const spiceById = new Map(
      input.items.map((i) => [
        String(i.id),
        typeof i.spiceLevel === "string" ? i.spiceLevel : null,
      ]),
    );

    await tx.insert(orderItems).values(
      totals.lines.map((l) => ({
        orderId: order.id,
        itemName: l.name, // resolved from catalog, not the client payload
        itemPrice: toDollars(l.priceCents),
        quantity: l.qty,
        spiceLevel: spiceById.get(l.id) ?? null,
      })),
    );
    return { orderId: order.id, accessToken };
  });
}
