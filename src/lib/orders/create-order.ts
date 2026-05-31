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
