import { describe, it, expect } from "vitest";
import { computeDeliveryFee, assertDeliverable, MinOrderError } from "@/lib/orders/delivery-pricing";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const d = (over: Partial<typeof DEFAULT_SETTINGS.delivery>) => ({ ...DEFAULT_SETTINGS.delivery, ...over });

describe("computeDeliveryFee", () => {
  it("live mode returns the doordash fee when no markup", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 700, subtotalCents: 3000 }, d({ mode: "live" }));
    expect(r.feeCents).toBe(700);
    expect(r.freeApplied).toBe(false);
  });

  it("live mode adds flat + percent markup", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 1000, subtotalCents: 3000 },
      d({ mode: "live", markupCents: 200, markupPercent: 10 }));
    expect(r.feeCents).toBe(1000 + 200 + 100); // 1300
  });

  it("flat mode ignores the doordash fee", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 1234, subtotalCents: 3000 },
      d({ mode: "flat", flatFeeCents: 599 }));
    expect(r.feeCents).toBe(599);
  });

  it("free threshold zeroes the fee at/above the threshold", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 700, subtotalCents: 5000 },
      d({ mode: "live", freeThresholdCents: 5000 }));
    expect(r.feeCents).toBe(0);
    expect(r.freeApplied).toBe(true);
  });

  it("free threshold does not apply below the threshold", () => {
    const r = computeDeliveryFee({ doordashFeeCents: 700, subtotalCents: 4999 },
      d({ mode: "live", freeThresholdCents: 5000 }));
    expect(r.feeCents).toBe(700);
  });
});

describe("assertDeliverable", () => {
  it("passes when at/above min order", () => {
    expect(() => assertDeliverable({ subtotalCents: 2000 }, d({ minOrderCents: 2000 }))).not.toThrow();
  });
  it("throws MinOrderError below min order", () => {
    expect(() => assertDeliverable({ subtotalCents: 1999 }, d({ minOrderCents: 2000 }))).toThrow(MinOrderError);
  });
  it("no min order configured ⇒ always deliverable", () => {
    expect(() => assertDeliverable({ subtotalCents: 1 }, d({ minOrderCents: 0 }))).not.toThrow();
  });
});
