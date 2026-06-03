import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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

export async function GET() {
  try {
    await requireRole(["owner"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  // SELECT explicit columns — never expose passwordHash
  const rows = await db
    .select({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    })
    .from(staff)
    .orderBy(staff.createdAt);

  return NextResponse.json({ staff: rows });
}

export async function POST(req: Request) {
  try {
    await requireRole(["owner"]);
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
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }
  if (!isValidRole(role)) {
    return NextResponse.json({ error: "role must be one of: owner, manager, staff" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  try {
    const [created] = await db
      .insert(staff)
      .values({ name, email, passwordHash, role })
      .returning({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
      });

    return NextResponse.json({ staff: created }, { status: 201 });
  } catch (e: unknown) {
    // Postgres unique violation code 23505
    if (
      e instanceof Error &&
      "code" in e &&
      (e as { code: string }).code === "23505"
    ) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("[admin staff POST]", e);
    return NextResponse.json({ error: "Could not create staff member" }, { status: 500 });
  }
}
