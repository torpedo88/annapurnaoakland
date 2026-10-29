import { describe, it, expect } from "vitest";
import { fmtClock, fmtElapsed, minutesBetween, kitchenUrgency } from "./kitchen-time";

const t0 = Date.parse("2026-10-29T01:30:00.000Z"); // 6:30 PM PDT

describe("fmtClock", () => {
  it("formats in restaurant (Pacific) time", () => {
    expect(fmtClock(new Date(t0))).toBe("6:30 PM");
    expect(fmtClock("2026-10-29T01:30:00.000Z")).toBe("6:30 PM");
  });
});

describe("fmtElapsed", () => {
  it("shows m:ss under an hour", () => {
    expect(fmtElapsed(t0, t0)).toBe("0:00");
    expect(fmtElapsed(t0, t0 + 65_000)).toBe("1:05");
    expect(fmtElapsed(t0, t0 + 12 * 60_000 + 4_000)).toBe("12:04");
  });
  it("shows h:mm:ss past an hour", () => {
    expect(fmtElapsed(t0, t0 + 3_725_000)).toBe("1:02:05");
  });
  it("clamps clock skew to 0:00", () => {
    expect(fmtElapsed(t0 + 5_000, t0)).toBe("0:00");
  });
});

describe("minutesBetween", () => {
  it("floors and never goes negative", () => {
    expect(minutesBetween(t0, t0 + 12 * 60_000 + 59_000)).toBe(12);
    expect(minutesBetween(t0 + 60_000, t0)).toBe(0);
  });
});

describe("kitchenUrgency", () => {
  it("flags at 15 and 25 minutes", () => {
    expect(kitchenUrgency(14)).toBe("ok");
    expect(kitchenUrgency(15)).toBe("warn");
    expect(kitchenUrgency(24)).toBe("warn");
    expect(kitchenUrgency(25)).toBe("late");
  });
});
