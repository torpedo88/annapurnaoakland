import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { promos } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select({
      code: promos.code,
      description: promos.description,
      discountType: promos.discountType,
      discountValue: promos.discountValue,
      minOrder: promos.minOrder,
      expiresAt: promos.expiresAt,
      startsAt: promos.startsAt,
      maxRedemptions: promos.maxRedemptions,
      timesRedeemed: promos.timesRedeemed,
    })
    .from(promos)
    .where(eq(promos.isActive, true));

  const now = Date.now();
  const filtered = rows.filter((p) => {
    if (p.startsAt && new Date(p.startsAt).getTime() > now) return false;
    if (p.expiresAt && new Date(p.expiresAt).getTime() < now) return false;
    if (p.maxRedemptions != null && p.timesRedeemed >= p.maxRedemptions) return false;
    return true;
  });

  const result = filtered.map(({ code, description, discountType, discountValue, minOrder, expiresAt }) => ({
    code,
    description,
    discountType,
    discountValue,
    minOrder,
    expiresAt,
  }));

  return NextResponse.json(
    { promos: result },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
