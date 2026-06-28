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
  tip: 5,
  deliveryFee: 6.99,
  discount: 2,
  total: 21.42,
  paymentStatus: "paid",
  source: "web",
};

describe("buildStarLineTicket", () => {
  it("includes header, order type/number, and items with mods", () => {
    const t = buildStarLineTicket(base);
    expect(t).toContain("ANNAPURNA");
    expect(t).toContain("#1042");
    expect(t).toContain("PICKUP");
    expect(t).toContain("2x Chicken Momo");
    expect(t).toContain("- spice: medium");
  });

  it("lists NO prices anywhere (kitchen ticket)", () => {
    const t = buildStarLineTicket(base);
    expect(t).not.toContain("$");
    expect(t).not.toMatch(/total/i);
    expect(t).not.toMatch(/subtotal/i);
    expect(t).not.toMatch(/\btax\b/i);
    expect(t).not.toMatch(/\btip\b/i);
    expect(t).not.toMatch(/payment/i);
    expect(t).not.toContain("21.42");
    expect(t).not.toContain("19.49");
  });

  it("prints a reorder QR (Star 2D barcode command) with the menu URL + promo", () => {
    const t = buildStarLineTicket(base);
    expect(t).toContain("Scan to reorder");
    expect(t).toContain("annapurnaoakland.com/menu");
    expect(t).toContain("promo=REORDER10");
    // ESC GS y P — the Star Line Mode "print QR" command terminates the QR block.
    expect(t).toContain("\x1b\x1d\x79\x50");
  });

  it("shows the 10% reorder discount code under the QR", () => {
    const t = buildStarLineTicket(base);
    expect(t).toContain("10% OFF your next order");
    expect(t).toContain("REORDER10");
  });

  it("emits header sizing and ends with a cut", () => {
    const t = buildStarLineTicket(base);
    expect(t).toContain("\x1bi\x01\x01"); // double size
    expect(t.endsWith("\x1bd\x03")).toBe(true); // cut last
  });

  it("shows delivery address for delivery orders, omits for pickup", () => {
    expect(buildStarLineTicket(base)).not.toContain("Clay St");
    const delivery = buildStarLineTicket({
      ...base,
      orderType: "delivery",
      deliveryAddress: "948 Clay St, Oakland, CA",
    });
    expect(delivery).toContain("948 Clay St, Oakland, CA");
    expect(delivery).toContain("DELIVERY");
  });
});
