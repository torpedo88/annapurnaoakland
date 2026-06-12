import { describe, it, expect } from "vitest";
import { parseAddress, formatAddress } from "@/lib/orders/address";

describe("parseAddress", () => {
  it("parses a standard Google single-line address", () => {
    expect(parseAddress("529 Buena Vista Ave, Alameda, CA 94501, USA")).toEqual({
      street: "529 Buena Vista Ave", unit: "", city: "Alameda", state: "CA", zip: "94501",
    });
  });
  it("extracts a unit from the street", () => {
    expect(parseAddress("948 Clay St #5, Oakland, CA 94607, USA")).toEqual({
      street: "948 Clay St", unit: "5", city: "Oakland", state: "CA", zip: "94607",
    });
  });
  it("handles Apt/Suite tokens", () => {
    expect(parseAddress("100 Main St Apt 12, Berkeley, CA 94704")).toEqual({
      street: "100 Main St", unit: "12", city: "Berkeley", state: "CA", zip: "94704",
    });
  });
  it("keeps a ZIP+4", () => {
    expect(parseAddress("948 Clay St, Oakland, CA 94607-3906").zip).toBe("94607-3906");
  });
  it("returns empty parts for blank input", () => {
    expect(parseAddress("")).toEqual({ street: "", unit: "", city: "", state: "", zip: "" });
  });
});

describe("formatAddress", () => {
  it("composes a single line with the unit folded in", () => {
    expect(formatAddress({ street: "529 Buena Vista Ave", unit: "2B", city: "Alameda", state: "CA", zip: "94501" }))
      .toBe("529 Buena Vista Ave #2B, Alameda, CA 94501");
  });
  it("omits empty parts", () => {
    expect(formatAddress({ street: "100 Main St", city: "Oakland", state: "CA", zip: "94607" }))
      .toBe("100 Main St, Oakland, CA 94607");
  });
});
