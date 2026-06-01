import type { DeliverySettings } from "@/lib/settings";

export class MinOrderError extends Error {
  constructor(public minOrderCents: number) {
    super("Order below delivery minimum");
    this.name = "MinOrderError";
  }
}

export interface DeliveryFeeInput {
  doordashFeeCents: number;
  subtotalCents: number;
}

export interface DeliveryFeeResult {
  feeCents: number;
  freeApplied: boolean;
}

/** Apply admin delivery config on top of the authoritative DoorDash fee. */
export function computeDeliveryFee(
  input: DeliveryFeeInput,
  settings: DeliverySettings,
): DeliveryFeeResult {
  const base =
    settings.mode === "flat"
      ? settings.flatFeeCents
      : input.doordashFeeCents +
        settings.markupCents +
        Math.round(input.doordashFeeCents * (settings.markupPercent / 100));

  const free =
    settings.freeThresholdCents > 0 && input.subtotalCents >= settings.freeThresholdCents;

  return { feeCents: free ? 0 : Math.max(0, Math.round(base)), freeApplied: free };
}

/** Throws MinOrderError if the subtotal is below the configured delivery minimum. */
export function assertDeliverable(
  input: { subtotalCents: number },
  settings: DeliverySettings,
): void {
  if (settings.minOrderCents > 0 && input.subtotalCents < settings.minOrderCents) {
    throw new MinOrderError(settings.minOrderCents);
  }
}
