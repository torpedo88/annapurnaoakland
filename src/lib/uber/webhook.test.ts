import { describe, it, expect } from "vitest";
import { mapUberStatus, parseUberEvent } from "@/lib/uber/webhook";

describe("mapUberStatus", () => {
  it("maps pickup_complete to courier_picked_up", () => {
    expect(mapUberStatus("pickup_complete")).toBe("courier_picked_up");
  });
  it("maps dropoff to en_route", () => {
    expect(mapUberStatus("dropoff")).toBe("en_route");
  });
  it("maps delivered, and canceled/returned to cancelled", () => {
    expect(mapUberStatus("delivered")).toBe("delivered");
    expect(mapUberStatus("canceled")).toBe("cancelled");
    expect(mapUberStatus("returned")).toBe("cancelled");
  });
  it("returns null for early/unknown statuses", () => {
    expect(mapUberStatus("pending")).toBeNull();
    expect(mapUberStatus("pickup")).toBeNull();
    expect(mapUberStatus("nonsense")).toBeNull();
    expect(mapUberStatus(null)).toBeNull();
  });
});

describe("parseUberEvent", () => {
  it("reads delivery id, status, tracking url from data envelope", () => {
    const evt = parseUberEvent({
      event_id: "evt_1",
      data: { id: "del_abc", status: "dropoff", tracking_url: "https://uber.com/track/x" },
    });
    expect(evt).toEqual({
      deliveryId: "del_abc",
      status: "dropoff",
      trackingUrl: "https://uber.com/track/x",
      eventId: "evt_1",
    });
  });
  it("ignores unknown statuses and non-https tracking urls", () => {
    const evt = parseUberEvent({ delivery_id: "del_2", status: "bogus", tracking_url: "http://insecure" });
    expect(evt.status).toBeNull();
    expect(evt.trackingUrl).toBeNull();
    expect(evt.deliveryId).toBe("del_2");
  });
});
