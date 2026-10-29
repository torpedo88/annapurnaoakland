// Kitchen ticket timing, shared by the admin board (live timer) and the printed
// tickets. "Received" is when the customer placed the order (orders.created_at);
// the kitchen clock starts when the ticket first reached the kitchen
// (orders.kitchen_received_at, stamped on first print and never cleared by a
// reprint).

const TZ = "America/Los_Angeles";

// Minutes in the kitchen before a ticket is flagged late / very late.
export const KITCHEN_WARN_MIN = 15;
export const KITCHEN_LATE_MIN = 25;

export type KitchenUrgency = "ok" | "warn" | "late";

// "6:42 PM" in restaurant time.
export function fmtClock(at: string | Date): string {
  return new Date(at).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
}

// Elapsed time as "m:ss", or "h:mm:ss" past an hour. Negative spans (clock skew
// between server and device) read as 0:00.
export function fmtElapsed(fromMs: number, nowMs: number): string {
  const total = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

// Whole minutes between two instants, floored, never negative.
export function minutesBetween(fromMs: number, toMs: number): number {
  return Math.max(0, Math.floor((toMs - fromMs) / 60_000));
}

export function kitchenUrgency(minutes: number): KitchenUrgency {
  if (minutes >= KITCHEN_LATE_MIN) return "late";
  if (minutes >= KITCHEN_WARN_MIN) return "warn";
  return "ok";
}
