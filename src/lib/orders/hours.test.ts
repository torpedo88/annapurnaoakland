import { describe, it, expect } from "vitest";
import { isOpenAt, isOrderingOpen } from "@/lib/orders/hours";

describe("isOpenAt", () => {
  it("is closed all day Sunday", () => {
    expect(isOpenAt(0, 14 * 60).open).toBe(false);
  });
  it("is closed before 11:00", () => {
    expect(isOpenAt(2, 10 * 60 + 59).open).toBe(false);
  });
  it("is open midday on a weekday", () => {
    expect(isOpenAt(2, 14 * 60).open).toBe(true);
  });
  it("is open at the last-order minute boundary (21:19)", () => {
    expect(isOpenAt(6, 21 * 60 + 19).open).toBe(true);
  });
  it("is closed within 10 minutes of close (21:20+)", () => {
    expect(isOpenAt(6, 21 * 60 + 20).open).toBe(false);
    expect(isOpenAt(6, 21 * 60 + 30).open).toBe(false);
  });
});

describe("isOrderingOpen", () => {
  it("returns a structured window for an instant", () => {
    const r = isOrderingOpen(new Date("2026-06-14T19:00:00Z")); // Sunday 12:00 PDT
    expect(r.open).toBe(false);
    expect(r.reason).toMatch(/Sunday/);
  });
});
