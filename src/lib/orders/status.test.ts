import { describe, it, expect } from "vitest";
import { nextStatuses, canTransition } from "@/lib/orders/status";

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
