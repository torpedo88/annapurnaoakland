export type DeliveryStatus =
  | "quote" | "created" | "confirmed" | "enroute_to_pickup" | "picked_up"
  | "enroute_to_dropoff" | "delivered" | "cancelled";

export interface QuoteInput {
  externalDeliveryId: string;
  dropoffAddress: string;
  dropoffPhone: string;
  orderValueCents: number;
}
export interface QuoteResult {
  externalDeliveryId: string;
  feeCents: number;
  currency: string;
  durationSeconds: number | null;
}
export interface AcceptResult {
  externalDeliveryId: string;
  feeCents: number;
  trackingUrl: string | null;
  status: string;
}
