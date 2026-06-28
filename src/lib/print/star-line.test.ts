import { describe, it, expect } from "vitest";
import { buildStarLineTicket } from "./star-line";
import type { PrintOrder } from "./serialize";

const base: PrintOrder = {
  id: "o1",
  orderNumber: 1042,
  orderType: "pickup",
  createdAt: "2026-06-27T19:01:00.000Z",
  customerName: "Test Customer",
  customerPhone: "510-555-0000",
  deliveryAddress: null,
  items: [
    { name: "Chicken Momo", qty: 2, spiceLevel: "medium", riceChoice: null, specialInstructions: null, traySize: null },
    { name: "Garlic Naan", qty: 1, spiceLevel: null, riceChoice: null, specialInstructions: null, traySize: null },
  ],
  subtotal: 19.49,
  tax: 1.93,
  tip: 0,
  deliveryFee: 0,
  discount: 0,
  total: 21.42,
  paymentStatus: "paid",
  source: "web",
};

describe("buildStarLineTicket", () => {
  it("includes header, order number, items with mods, and total", () => {
    const t = buildStarLineTicket(base);
    expect(t).toContain("ANNAPURNA");
    expect(t).toContain("#1042");
    expect(t).toContain("PICKUP");
    expect(t).toContain("2 x Chicken Momo");
    expect(t).toContain("- spice: medium");
    expect(t).toContain("TOTAL");
    expect(t).toContain("$21.42");
  });

  it("emits the double-size header and cut control codes", () => {
    const t = buildStarLineTicket(base);
    expect(t).toContain("\x1bi\x01\x01"); // big on
    expect(t).toContain("\x1bi\x00\x00"); // normal
    expect(t.endsWith("\x1bd\x03")).toBe(true); // cut last
  });

  it("omits zero rows and pickup address; shows delivery address", () => {
    const pickup = buildStarLineTicket(base);
    expect(pickup).not.toContain("Tip");
    expect(pickup).not.toContain("Delivery");

    const delivery = buildStarLineTicket({
      ...base,
      orderType: "delivery",
      deliveryAddress: "948 Clay St, Oakland, CA",
      deliveryFee: 6.99,
      tip: 6,
    });
    expect(delivery).toContain("948 Clay St, Oakland, CA");
    expect(delivery).toContain("Delivery");
    expect(delivery).toContain("Tip");
  });
});
