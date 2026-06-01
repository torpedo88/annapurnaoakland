import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    tax_rate: s.tax_rate,
    ordering_paused: s.ordering_paused,
    pickup_enabled: s.pickup_enabled,
    delivery_enabled: s.delivery_enabled,
    delivery: {
      freeThresholdCents: s.delivery.freeThresholdCents,
      minOrderCents: s.delivery.minOrderCents,
    },
  });
}
