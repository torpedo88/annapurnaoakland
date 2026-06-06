import { describe, it, expect } from "vitest";
import { nextStatuses, canTransition, PENDING_PAYMENT, SELF_DELIVERY_FLOW } from "@/lib/orders/status";

describe("nextStatuses (staff buttons)", () => {
  it("pickup received -> [preparing, cancelled]", () => {
    expect(nextStatuses("pickup", "received")).toEqual(["preparing", "cancelled"]);
  });
  it("pickup ready -> [completed, cancelled]", () => {
    expect(nextStatuses("pickup", "ready")).toEqual(["completed", "cancelled"]);
  });
  it("delivery ready -> only [cancelled] (courier states are webhook-driven)", () => {
    expect(nextStatuses("delivery", "ready")).toEqual(["cancelled"]);
  });
  it("terminal -> []", () => {
    expect(nextStatuses("pickup", "completed")).toEqual([]);
    expect(nextStatuses("delivery", "delivered")).toEqual([]);
    expect(nextStatuses("pickup", "cancelled")).toEqual([]);
  });
});

describe("canTransition", () => {
  it("staff advances pickup one step forward", () => {
    expect(canTransition("pickup", "received", "preparing", "staff")).toBe(true);
    expect(canTransition("pickup", "ready", "completed", "staff")).toBe(true);
  });
  it("staff cannot skip or go backward", () => {
    expect(canTransition("pickup", "received", "ready", "staff")).toBe(false);
    expect(canTransition("pickup", "ready", "preparing", "staff")).toBe(false);
  });
  it("staff cannot set delivery courier states", () => {
    expect(canTransition("delivery", "ready", "courier_picked_up", "staff")).toBe(false);
  });
  it("staff may cancel any non-terminal", () => {
    expect(canTransition("pickup", "preparing", "cancelled", "staff")).toBe(true);
    expect(canTransition("delivery", "received", "cancelled", "staff")).toBe(true);
  });
  it("cannot transition out of a terminal state", () => {
    expect(canTransition("pickup", "completed", "cancelled", "staff")).toBe(false);
    expect(canTransition("delivery", "delivered", "en_route", "webhook")).toBe(false);
  });
  it("webhook may jump forward through delivery courier states (events can skip)", () => {
    expect(canTransition("delivery", "ready", "courier_picked_up", "webhook")).toBe(true);
    expect(canTransition("delivery", "ready", "delivered", "webhook")).toBe(true);
    expect(canTransition("delivery", "courier_picked_up", "en_route", "webhook")).toBe(true);
  });
  it("webhook cannot move pickup orders or go backward", () => {
    expect(canTransition("pickup", "received", "courier_picked_up", "webhook")).toBe(false);
    expect(canTransition("delivery", "en_route", "ready", "webhook")).toBe(false);
  });
});

describe("self-delivery mode (selfDelivery = true)", () => {
  it("staff can advance delivery received→preparing→ready→out_for_delivery→delivered", () => {
    const steps = [...SELF_DELIVERY_FLOW];
    for (let i = 0; i < steps.length - 1; i++) {
      const from = steps[i]!;
      const to = steps[i + 1]!;
      expect(canTransition("delivery", from, to, "staff", true)).toBe(true);
    }
  });
  it("nextStatuses includes out_for_delivery and delivered for staff in self-delivery mode", () => {
    expect(nextStatuses("delivery", "ready", true)).toEqual(["out_for_delivery", "cancelled"]);
    expect(nextStatuses("delivery", "out_for_delivery", true)).toEqual(["delivered", "cancelled"]);
  });
  it("nextStatuses in self-delivery mode returns [] once delivered (terminal)", () => {
    expect(nextStatuses("delivery", "delivered", true)).toEqual([]);
  });
  it("staff cannot skip steps in self-delivery mode", () => {
    expect(canTransition("delivery", "received", "ready", "staff", true)).toBe(false);
    expect(canTransition("delivery", "received", "out_for_delivery", "staff", true)).toBe(false);
  });
  it("webhook cannot drive self-delivery flow", () => {
    expect(canTransition("delivery", "ready", "out_for_delivery", "webhook", true)).toBe(false);
    expect(canTransition("delivery", "ready", "delivered", "webhook", true)).toBe(false);
  });
  it("staff still cannot reach courier states in DoorDash mode (selfDelivery=false)", () => {
    expect(canTransition("delivery", "ready", "courier_picked_up", "staff", false)).toBe(false);
    expect(canTransition("delivery", "ready", "en_route", "staff", false)).toBe(false);
    expect(canTransition("delivery", "ready", "delivered", "staff", false)).toBe(false);
  });
  it("nextStatuses in DoorDash mode still caps staff at ready (no courier states)", () => {
    expect(nextStatuses("delivery", "ready", false)).toEqual(["cancelled"]);
    expect(nextStatuses("delivery", "preparing", false)).toEqual(["ready", "cancelled"]);
  });
  it("staff may cancel in self-delivery mode at any non-terminal step", () => {
    for (const step of ["received", "preparing", "ready", "out_for_delivery"]) {
      expect(canTransition("delivery", step, "cancelled", "staff", true)).toBe(true);
    }
  });
});

describe("pending_payment", () => {
  it("webhook advances pending_payment → received", () => {
    expect(canTransition("delivery", PENDING_PAYMENT, "received", "webhook")).toBe(true);
    expect(canTransition("pickup", PENDING_PAYMENT, "received", "webhook")).toBe(true);
  });
  it("staff cannot advance pending_payment → received", () => {
    expect(canTransition("pickup", PENDING_PAYMENT, "received", "staff")).toBe(false);
  });
  it("pending_payment can be cancelled", () => {
    expect(canTransition("delivery", PENDING_PAYMENT, "cancelled", "webhook")).toBe(true);
  });
  it("nothing transitions into pending_payment", () => {
    expect(canTransition("pickup", "received", PENDING_PAYMENT, "staff")).toBe(false);
  });
});
