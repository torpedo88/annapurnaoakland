import { describe, it, expect } from "vitest";
import { mapDeliveryStatus } from "@/lib/doordash/webhook";

describe("mapDeliveryStatus", () => {
  it("maps pickup-side events to courier_picked_up", () => {
    for (const s of ["enroute_to_pickup", "arrived_at_pickup", "picked_up"]) {
      expect(mapDeliveryStatus(s)).toBe("courier_picked_up");
    }
  });
  it("maps dropoff-enroute events to en_route", () => {
    for (const s of ["enroute_to_dropoff", "arrived_at_dropoff"]) {
      expect(mapDeliveryStatus(s)).toBe("en_route");
    }
  });
  it("maps delivered and cancelled", () => {
    expect(mapDeliveryStatus("delivered")).toBe("delivered");
    expect(mapDeliveryStatus("cancelled")).toBe("cancelled");
  });
  it("returns null for unmapped/early statuses", () => {
    expect(mapDeliveryStatus("created")).toBeNull();
    expect(mapDeliveryStatus("confirmed")).toBeNull();
    expect(mapDeliveryStatus("nonsense")).toBeNull();
  });
});
