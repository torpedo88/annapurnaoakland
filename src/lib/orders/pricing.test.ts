import { describe, it, expect } from "vitest";
import { priceOrder } from "@/lib/orders/pricing";
import type { PriceCatalog } from "@/lib/menu/catalog";

const WATER = "beverages-regular-water";
const catalog: PriceCatalog = new Map([[WATER, { name: "Regular Water", priceCents: 299 }]]);

describe("priceOrder taxRate injection", () => {
  it("uses the injected tax rate", () => {
    const t = priceOrder([{ id: WATER, qty: 1 }], { taxRate: 0.10 }, catalog);
    expect(t.subtotalCents).toBe(299);
    expect(t.taxCents).toBe(Math.round(299 * 0.10)); // 30
  });

  it("falls back to the default rate when none injected", () => {
    const t = priceOrder([{ id: WATER, qty: 1 }], {}, catalog);
    expect(t.taxCents).toBe(Math.round(299 * 0.0925)); // 28
  });

  it("rejects unknown items not in the catalog", () => {
    expect(() => priceOrder([{ id: "nope", qty: 1 }], {}, catalog)).toThrow();
  });
});
