import { NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { requireRole, AuthError } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

const VALID_ROLES = ["owner", "manager", "staff"] as const;
type StaffRole = (typeof VALID_ROLES)[number];

function isValidRole(r: unknown): r is StaffRole {
  return VALID_ROLES.includes(r as StaffRole);
}

/** Count active owners excluding a specific id. Used to guard last-owner removal. */
async function countOtherActiveOwners(excludeId: string): Promise<number> {
  const rows = await db
    .select({ id: staff.id })
    .from(staff)
    .where(
      and(
        eq(staff.role, "owner"),
        eq(staff.isActive, true),
        ne(staff.id, excludeId)
      )
    );
  return rows.length;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["owner"]);
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

  // Fetch current record
  const [current] = await db
    .select({ id: staff.id, role: staff.role, isActive: staff.isActive })
    .from(staff)
    .where(eq(staff.id, id))
    .limit(1);

  if (!current) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  // Build update payload
  const updates: Partial<{
    role: string;
    isActive: boolean;
    passwordHash: string;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (body.role !== undefined) {
    if (!isValidRole(body.role)) {
      return NextResponse.json({ error: "role must be one of: owner, manager, staff" }, { status: 400 });
    }
    updates.role = body.role;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }
    updates.isActive = body.isActive;
  }

  if (typeof body.password === "string") {
    if (!body.password) {
      return NextResponse.json({ error: "password cannot be empty" }, { status: 400 });
    }
    updates.passwordHash = await hashPassword(body.password);
  }

  // Guard: cannot remove/deactivate the last active owner
  const effectiveRole = updates.role ?? current.role;
  const effectiveIsActive = updates.isActive ?? current.isActive;
  const isCurrentlyOwner = current.role === "owner";

  if (isCurrentlyOwner) {
    const wouldLoseOwnerStatus =
      (updates.role !== undefined && updates.role !== "owner") ||
      (updates.isActive !== undefined && !updates.isActive);

    if (wouldLoseOwnerStatus) {
      const otherActiveOwners = await countOtherActiveOwners(id);
      if (otherActiveOwners === 0) {
        return NextResponse.json(
          { error: "Cannot remove the last active owner" },
          { status: 409 }
        );
      }
    }
  }

  // Suppress unused-variable warning for effectiveRole/effectiveIsActive — they
  // exist to make the guard logic readable but are not used after this point.
  void effectiveRole;
  void effectiveIsActive;

  await db.update(staff).set(updates).where(eq(staff.id, id));

  // Return updated row without passwordHash
  const [updated] = await db
    .select({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    })
    .from(staff)
    .where(eq(staff.id, id))
    .limit(1);

  return NextResponse.json({ staff: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["owner"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  const { id } = await params;

  const [current] = await db
    .select({ id: staff.id, role: staff.role, isActive: staff.isActive })
    .from(staff)
    .where(eq(staff.id, id))
    .limit(1);

  if (!current) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  // Guard: cannot delete the last active owner
  if (current.role === "owner" && current.isActive) {
    const otherActiveOwners = await countOtherActiveOwners(id);
    if (otherActiveOwners === 0) {
      return NextResponse.json(
        { error: "Cannot remove the last active owner" },
        { status: 409 }
      );
    }
  }

  await db.delete(staff).where(eq(staff.id, id));
  return NextResponse.json({ ok: true });
}
