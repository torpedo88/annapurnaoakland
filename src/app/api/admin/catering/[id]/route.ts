import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cateringRequests } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["pending", "quoted", "confirmed", "declined"] as const;
type CateringStatus = (typeof ALLOWED_STATUSES)[number];

function isAllowedStatus(s: unknown): s is CateringStatus {
  return typeof s === "string" && (ALLOWED_STATUSES as readonly string[]).includes(s);
}

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
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate that the row exists
  const [existing] = await db
    .select({ id: cateringRequests.id })
    .from(cateringRequests)
    .where(eq(cateringRequests.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch: {
    status?: CateringStatus;
    adminNotes?: string;
    quotedTotal?: string;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if ("status" in body) {
    if (!isAllowedStatus(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    patch.status = body.status;
  }

  if ("adminNotes" in body) {
    patch.adminNotes = typeof body.adminNotes === "string" ? body.adminNotes : "";
  }

  if ("quotedTotal" in body) {
    const raw = body.quotedTotal;
    if (raw === null || raw === "" || raw === undefined) {
      patch.quotedTotal = undefined;
    } else {
      const num = Number(raw);
      if (isNaN(num) || num < 0) {
        return NextResponse.json({ error: "quotedTotal must be a non-negative number" }, { status: 400 });
      }
      patch.quotedTotal = num.toFixed(2);
    }
  }

  const [updated] = await db
    .update(cateringRequests)
    .set(patch)
    .where(eq(cateringRequests.id, id))
    .returning();

  return NextResponse.json({ request: updated });
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
    .select({ id: cateringRequests.id })
    .from(cateringRequests)
    .where(eq(cateringRequests.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(cateringRequests).where(eq(cateringRequests.id, id));

  return NextResponse.json({ ok: true });
}
