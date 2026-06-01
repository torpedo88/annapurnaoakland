import { describe, it, expect } from "vitest";
import { mergeSettings, DEFAULT_SETTINGS } from "@/lib/settings";

describe("mergeSettings", () => {
  it("returns defaults when no rows", () => {
    expect(mergeSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it("overrides scalar keys from rows", () => {
    const s = mergeSettings([{ key: "tax_rate", value: 0.05 }]);
    expect(s.tax_rate).toBe(0.05);
  });

  it("deep-merges the delivery object", () => {
    const s = mergeSettings([{ key: "delivery", value: { mode: "flat", flatFeeCents: 599 } }]);
    expect(s.delivery.mode).toBe("flat");
    expect(s.delivery.flatFeeCents).toBe(599);
    expect(s.delivery.markupCents).toBe(DEFAULT_SETTINGS.delivery.markupCents);
  });

  it("ignores unknown keys", () => {
    const s = mergeSettings([{ key: "nope", value: 1 }]);
    expect(s).toEqual(DEFAULT_SETTINGS);
  });

  it("ignores a wrong-typed tax_rate", () => {
    const s = mergeSettings([{ key: "tax_rate", value: "high" }]);
    expect(s.tax_rate).toBe(DEFAULT_SETTINGS.tax_rate);
  });
});
