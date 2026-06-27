import { describe, it, expect } from "vitest";
import { serializePrintOrder } from "./serialize";
import type { orders, orderItems } from "@/db/schema";

type OrderRow = typeof orders.$inferSelect;
type ItemRow = typeof orderItems.$inferSelect;

const baseOrder = {
  id: "order-1",
  orderNumber: 42,
  orderType: "delivery",
  createdAt: new Date("2026-06-27T19:00:00.000Z"),
  customerName: "Asha",
  customerPhone: "5105550123",
  deliveryAddress: "948 Clay St, Oakland",
  subtotal: "20.00",
  tax: "1.80",
  tip: "3.00",
  deliveryFee: "6.99",
  discount: "2.00",
  total: "29.79",
  paymentStatus: "paid",
  source: "online",
} as unknown as OrderRow;

const items = [
  { itemName: "Chicken Momo", quantity: 2, spiceLevel: "medium", riceChoice: null, specialInstructions: "no onion", traySize: null },
  { itemName: "Garlic Naan", quantity: 1, spiceLevel: null, riceChoice: null, specialInstructions: null, traySize: null },
] as unknown as ItemRow[];

describe("serializePrintOrder", () => {
  it("maps an order + items to the print payload", () => {
    const p = serializePrintOrder(baseOrder, items);
    expect(p.id).toBe("order-1");
    expect(p.orderNumber).toBe(42);
    expect(p.orderType).toBe("delivery");
    expect(p.customerName).toBe("Asha");
    expect(p.deliveryAddress).toBe("948 Clay St, Oakland");
    expect(p.total).toBe(29.79);
    expect(p.tip).toBe(3);
    expect(p.createdAt).toBe("2026-06-27T19:00:00.000Z");
    expect(p.items).toHaveLength(2);
    expect(p.items[0]).toMatchObject({ name: "Chicken Momo", qty: 2, spiceLevel: "medium", specialInstructions: "no onion" });
  });

  it("defaults missing money to 0 and orderType to pickup", () => {
    const p = serializePrintOrder({ ...baseOrder, orderType: null, total: null, tip: null } as unknown as OrderRow, []);
    expect(p.orderType).toBe("pickup");
    expect(p.total).toBe(0);
    expect(p.tip).toBe(0);
    expect(p.items).toEqual([]);
  });

  it("omits the delivery address on pickup orders", () => {
    const p = serializePrintOrder({ ...baseOrder, orderType: "pickup" } as unknown as OrderRow, []);
    expect(p.deliveryAddress).toBeNull();
  });
});
