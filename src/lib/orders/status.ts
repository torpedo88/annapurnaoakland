export type Fulfillment = "pickup" | "delivery";
export type Actor = "staff" | "webhook";

export const PICKUP_FLOW = ["received", "preparing", "ready", "completed"] as const;
export const DELIVERY_FLOW = [
  "received", "preparing", "ready", "courier_picked_up", "en_route", "delivered",
] as const;
export const TERMINAL = new Set<string>(["completed", "delivered", "cancelled"]);

// Highest flow index a staff member may advance to (delivery's courier+ states are webhook-only).
const STAFF_MAX_INDEX: Record<Fulfillment, number> = { pickup: 3, delivery: 2 };

function flow(f: Fulfillment): readonly string[] {
  return f === "pickup" ? PICKUP_FLOW : DELIVERY_FLOW;
}

/** Staff-advanceable next states for the dashboard buttons (forward one step + cancel). */
export function nextStatuses(f: Fulfillment, current: string): string[] {
  if (TERMINAL.has(current)) return [];
  const fl = flow(f);
  const i = fl.indexOf(current);
  const out: string[] = [];
  if (i >= 0 && i < STAFF_MAX_INDEX[f] && i + 1 < fl.length) {
    const nxt = fl[i + 1];
    if (nxt) out.push(nxt);
  }
  out.push("cancelled");
  return out;
}

export function canTransition(f: Fulfillment, from: string, to: string, actor: Actor): boolean {
  if (from === to) return false;
  if (TERMINAL.has(from)) return false;
  if (to === "cancelled") return true; // either actor may cancel a non-terminal order
  const fl = flow(f);
  const fi = fl.indexOf(from);
  const ti = fl.indexOf(to);
  if (fi < 0 || ti < 0) return false;
  if (ti <= fi) return false; // forward only
  if (actor === "staff") return ti === fi + 1 && ti <= STAFF_MAX_INDEX[f];
  // webhook: delivery only, target must be a courier/delivered state; may skip intermediate events
  if (f !== "delivery") return false;
  return ti >= 3;
}
