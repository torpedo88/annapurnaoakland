import { describe, it, expect } from "vitest";
import { haversineMiles } from "@/lib/orders/distance";

describe("haversineMiles", () => {
  it("is zero for the same point", () => {
    const p = { lat: 37.8023, lng: -122.2752 };
    expect(haversineMiles(p, p)).toBe(0);
  });

  it("approximates 1 degree of latitude as ~69 miles", () => {
    const d = haversineMiles({ lat: 37, lng: -122 }, { lat: 38, lng: -122 });
    expect(d).toBeGreaterThan(68);
    expect(d).toBeLessThan(70);
  });

  it("computes the restaurant→Alameda distance within the delivery radius", () => {
    // Annapurna (948 Clay St) -> 529 Buena Vista Ave, Alameda — roughly 3 miles.
    const d = haversineMiles(
      { lat: 37.8023, lng: -122.2752 },
      { lat: 37.7706, lng: -122.2533 },
    );
    expect(d).toBeGreaterThan(1);
    expect(d).toBeLessThan(5);
  });

  it("is symmetric", () => {
    const a = { lat: 37.8, lng: -122.27 };
    const b = { lat: 37.87, lng: -122.27 };
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 10);
  });
});
