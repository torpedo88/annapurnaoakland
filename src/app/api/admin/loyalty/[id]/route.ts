import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { loyaltyRewards } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

const REWARD_TYPES = ["fixed", "percent", "free_item"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: loyaltyRewards.id })
    .from(loyaltyRewards)
    .where(eq(loyaltyRewards.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Reward not found" }, { status: 404 });
  }

  // Build patch object — only update fields explicitly provided
  const patch: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) {
    patch.name = body.name.trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    patch.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  }
  if (body.pointsRequired !== undefined && body.pointsRequired !== "") {
    const pts = Number(body.pointsRequired);
    if (isNaN(pts) || pts < 0) {
      return NextResponse.json(
        { error: "pointsRequired must be a non-negative number" },
        { status: 400 }
      );
    }
    patch.pointsRequired = pts;
  }
  if (
    typeof body.rewardType === "string" &&
    (REWARD_TYPES as readonly string[]).includes(body.rewardType)
  ) {
    patch.rewardType = body.rewardType;
  }
  if (body.rewardValue !== undefined && body.rewardValue !== "") {
    const raw = Number(body.rewardValue);
    if (!isNaN(raw) && raw >= 0) {
      const type =
        typeof patch.rewardType === "string"
          ? patch.rewardType
          : body.rewardType;
      patch.rewardValue =
        type === "percent"
          ? String(Math.min(100, Math.max(0, raw)))
          : String(raw);
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, "maxItemValue")) {
    patch.maxItemValue =
      body.maxItemValue !== "" && body.maxItemValue !== null && body.maxItemValue !== undefined
        ? String(Number(body.maxItemValue))
        : null;
  }
  if (body.sortOrder !== undefined && body.sortOrder !== "") {
    const so = Number(body.sortOrder);
    if (!isNaN(so)) patch.sortOrder = so;
  }
  if (typeof body.isActive === "boolean") {
    patch.isActive = body.isActive;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(loyaltyRewards)
      .set(patch)
      .where(eq(loyaltyRewards.id, id))
      .returning();

    return NextResponse.json({ reward: updated });
  } catch (e: unknown) {
    console.error("[admin loyalty PATCH]", e);
    return NextResponse.json({ error: "Could not update reward" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: loyaltyRewards.id })
    .from(loyaltyRewards)
    .where(eq(loyaltyRewards.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Reward not found" }, { status: 404 });
  }

  await db.delete(loyaltyRewards).where(eq(loyaltyRewards.id, id));
  return NextResponse.json({ ok: true });
}
