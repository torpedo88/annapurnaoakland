import type { orders, orderItems } from "@/db/schema";

// Compact, printer-friendly representation of an order. The Android print bridge
// consumes this JSON and renders the thermal ticket via the Star SDK, so the
// shape mirrors the fields shown on the existing kitchen receipt
// (src/components/admin/kitchen-receipt.tsx). Money is emitted as numbers;
// the DB stores decimals as strings.

type OrderRow = typeof orders.$inferSelect;
type ItemRow = typeof orderItems.$inferSelect;

export type PrintLineItem = {
  name: string;
  qty: number;
  spiceLevel: string | null;
  riceChoice: string | null;
  specialInstructions: string | null;
  traySize: string | null;
};

export type PrintOrder = {
  id: string;
  orderNumber: number | null;
  orderType: "pickup" | "delivery";
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  items: PrintLineItem[];
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentStatus: string;
  source: string;
};

const num = (v: string | null | undefined): number => (v == null ? 0 : Number(v) || 0);

export function serializePrintOrder(order: OrderRow, items: ItemRow[]): PrintOrder {
  const orderType = order.orderType === "delivery" ? "delivery" : "pickup";
  const created = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt as unknown as string);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderType,
    createdAt: created.toISOString(),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    // Pickup tickets don't need an address.
    deliveryAddress: orderType === "delivery" ? order.deliveryAddress : null,
    items: items.map((i) => ({
      name: i.itemName ?? "",
      qty: i.quantity ?? 1,
      spiceLevel: i.spiceLevel,
      riceChoice: i.riceChoice,
      specialInstructions: i.specialInstructions,
      traySize: i.traySize,
    })),
    subtotal: num(order.subtotal),
    tax: num(order.tax),
    tip: num(order.tip),
    deliveryFee: num(order.deliveryFee),
    discount: num(order.discount),
    total: num(order.total),
    paymentStatus: order.paymentStatus,
    source: order.source,
  };
}
