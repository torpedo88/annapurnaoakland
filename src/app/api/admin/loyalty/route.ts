import { NextResponse } from "next/server";
import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { loyaltyRewards } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

const REWARD_TYPES = ["fixed", "percent", "free_item"] as const;

function normalizeRewardType(v: unknown): string {
  return typeof v === "string" && (REWARD_TYPES as readonly string[]).includes(v)
    ? v
    : "fixed";
}

export async function GET() {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const rows = await db
    .select()
    .from(loyaltyRewards)
    .orderBy(
      sql`${loyaltyRewards.sortOrder} asc nulls last`,
      asc(loyaltyRewards.pointsRequired)
    );

  return NextResponse.json({ rewards: rows });
}

export async function POST(req: Request) {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const pointsRequired = Number(body.pointsRequired);
  if (isNaN(pointsRequired) || pointsRequired < 0) {
    return NextResponse.json(
      { error: "pointsRequired must be a non-negative number" },
      { status: 400 }
    );
  }

  const rewardType = normalizeRewardType(body.rewardType);

  const rawValue = Number(body.rewardValue);
  if (isNaN(rawValue) || rawValue < 0) {
    return NextResponse.json(
      { error: "rewardValue must be a non-negative number" },
      { status: 400 }
    );
  }
  const rewardValue =
    rewardType === "percent"
      ? String(Math.min(100, Math.max(0, rawValue)))
      : String(rawValue);

  const maxItemValue =
    body.maxItemValue !== undefined && body.maxItemValue !== "" && body.maxItemValue !== null
      ? String(Number(body.maxItemValue))
      : null;

  const sortOrder =
    body.sortOrder !== undefined && body.sortOrder !== "" && body.sortOrder !== null
      ? Number(body.sortOrder)
      : 0;

  const isActive = body.isActive !== false && body.isActive !== "false";

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  try {
    const [row] = await db
      .insert(loyaltyRewards)
      .values({
        name,
        description,
        pointsRequired,
        rewardType,
        rewardValue,
        maxItemValue,
        isActive,
        sortOrder,
      })
      .returning();

    return NextResponse.json({ reward: row }, { status: 201 });
  } catch (e: unknown) {
    console.error("[admin loyalty POST]", e);
    return NextResponse.json({ error: "Could not create reward" }, { status: 500 });
  }
}
