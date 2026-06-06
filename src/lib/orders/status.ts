export type Fulfillment = "pickup" | "delivery";
export type Actor = "staff" | "webhook";

export const PICKUP_FLOW = ["received", "preparing", "ready", "completed"] as const;
export const DELIVERY_FLOW = [
  "received", "preparing", "ready", "courier_picked_up", "en_route", "delivered",
] as const;
export const SELF_DELIVERY_FLOW = [
  "received", "preparing", "ready", "out_for_delivery", "delivered",
] as const;
export const TERMINAL = new Set<string>(["completed", "delivered", "cancelled"]);

// Pre-state for online orders awaiting Stripe payment. Not part of the staff
// flow; excluded from the active orders board. Advanced to "received" by the
// payment webhook, or "cancelled" if abandoned.
export const PENDING_PAYMENT = "pending_payment";

// Highest flow index a staff member may advance to (delivery's courier+ states are webhook-only).
const STAFF_MAX_INDEX: Record<Fulfillment, number> = { pickup: 3, delivery: 2 };

function flow(f: Fulfillment, selfDelivery = false): readonly string[] {
  if (f === "pickup") return PICKUP_FLOW;
  return selfDelivery ? SELF_DELIVERY_FLOW : DELIVERY_FLOW;
}

/** Staff-advanceable next states for the dashboard buttons (forward one step + cancel). */
export function nextStatuses(f: Fulfillment, current: string, selfDelivery = false): string[] {
  if (TERMINAL.has(current)) return [];
  const fl = flow(f, selfDelivery);
  const i = fl.indexOf(current);
  const out: string[] = [];
  // In self-delivery mode, staff may advance through the entire SELF_DELIVERY_FLOW.
  // In DoorDash mode, cap at STAFF_MAX_INDEX (courier+ states are webhook-only).
  const maxIndex = (f === "delivery" && selfDelivery) ? fl.length - 1 : STAFF_MAX_INDEX[f];
  if (i >= 0 && i < maxIndex && i + 1 < fl.length) {
    const nxt = fl[i + 1];
    if (nxt) out.push(nxt);
  }
  out.push("cancelled");
  return out;
}

export function canTransition(f: Fulfillment, from: string, to: string, actor: Actor, selfDelivery = false): boolean {
  if (from === to) return false;
  if (TERMINAL.has(from)) return false;
  if (to === "cancelled") return true; // either actor may cancel a non-terminal order
  // Payment confirmation: webhook moves a pending order into the kitchen flow.
  if (from === PENDING_PAYMENT) return to === "received" && actor === "webhook";
  if (to === PENDING_PAYMENT) return false;
  const fl = flow(f, selfDelivery);
  const fi = fl.indexOf(from);
  const ti = fl.indexOf(to);
  if (fi < 0 || ti < 0) return false;
  if (ti <= fi) return false; // forward only
  if (actor === "staff") {
    // In self-delivery mode staff may advance one step through the entire self-delivery flow.
    if (f === "delivery" && selfDelivery) return ti === fi + 1;
    return ti === fi + 1 && ti <= STAFF_MAX_INDEX[f];
  }
  // webhook: delivery only, target must be a courier/delivered state; may skip intermediate events
  if (f !== "delivery") return false;
  // In DoorDash mode courier states start at index 3; in self-delivery mode there are no courier
  // states — webhooks cannot drive the self-delivery flow.
  if (selfDelivery) return false;
  return ti >= 3;
}
