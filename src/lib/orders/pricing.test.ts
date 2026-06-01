import { describe, it, expect } from "vitest";
import { priceOrder } from "@/lib/orders/pricing";

// Uses a real catalog id from src/data/menu.ts:
// "beverages-regular-water" @ $2.99 (299 cents).
const WATER = "beverages-regular-water";

describe("priceOrder taxRate injection", () => {
  it("uses the injected tax rate", () => {
    const t = priceOrder([{ id: WATER, qty: 1 }], { taxRate: 0.10 });
    expect(t.subtotalCents).toBe(299);
    expect(t.taxCents).toBe(Math.round(299 * 0.10)); // 30
  });

  it("falls back to the default rate when none injected", () => {
    const t = priceOrder([{ id: WATER, qty: 1 }]);
    expect(t.taxCents).toBe(Math.round(299 * 0.0925)); // 28
  });
});
