import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { cateringRequests } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const rows = await db
    .select()
    .from(cateringRequests)
    .orderBy(desc(cateringRequests.createdAt));

  return NextResponse.json({ requests: rows });
}
