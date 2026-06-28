import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { serializePrintOrder } from "@/lib/print/serialize";
import { buildStarLineTicket } from "@/lib/print/star-line";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Star CloudPRNT endpoint. A Star network printer (TSP650II on the restaurant
// LAN) polls this URL itself over the internet — no tablet, Bluetooth, or local
// bridge. Flow per the CloudPRNT protocol:
//   POST   poll → { jobReady, mediaTypes, jobToken } when a ticket is waiting
//   GET    pull → the ticket bytes (application/vnd.star.line)
//   DELETE confirm → stamp kitchen_printed_at so it prints once
//
// Tickets print on ACCEPT: an order becomes printable when staff advance it from
// "received" to "preparing" (the board's accept action), and only while it has
// not yet been printed. A manual reprint clears kitchen_printed_at (see
// /api/admin/print-requeue), so the printer pulls it again on its next poll.
const PRINT_STATUS = "preparing";
const MEDIA = "application/vnd.star.line";

// HTTP Basic auth — the printer's CloudPRNT config has username/password fields.
// Username is ignored; the password must equal CLOUDPRNT_TOKEN.
function authed(req: Request): boolean {
  const secret = process.env.CLOUDPRNT_TOKEN;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const m = /^Basic\s+(.+)$/i.exec(header);
  if (!m?.[1]) return false;
  let pass = "";
  try {
    pass = Buffer.from(m[1], "base64").toString("utf8").split(":").slice(1).join(":");
  } catch {
    return false;
  }
  const a = Buffer.from(pass);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="cloudprnt"' },
  });
}

async function oldestPrintableId(): Promise<string | null> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, PRINT_STATUS), isNull(orders.kitchenPrintedAt)))
    .orderBy(asc(orders.createdAt))
    .limit(1);
  return row?.id ?? null;
}

// POST: the printer polls on its configured interval. Reply whether a ticket is ready.
export async function POST(req: Request) {
  if (!authed(req)) return unauthorized();
  const id = await oldestPrintableId();
  if (!id) return NextResponse.json({ jobReady: false });
  return NextResponse.json({ jobReady: true, mediaTypes: [MEDIA], jobToken: id });
}

// GET: the printer pulls the actual job. It echoes the jobToken from the poll.
export async function GET(req: Request) {
  if (!authed(req)) return unauthorized();
  const token = new URL(req.url).searchParams.get("token");
  const id = token ?? (await oldestPrintableId());
  if (!id) return new NextResponse("", { status: 200 });

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return new NextResponse("", { status: 200 });
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  const ticket = buildStarLineTicket(serializePrintOrder(order, items));
  return new NextResponse(Buffer.from(ticket, "utf8"), {
    status: 200,
    headers: { "Content-Type": MEDIA },
  });
}

// DELETE: the printer confirms it printed the job. Stamp once (idempotent).
export async function DELETE(req: Request) {
  if (!authed(req)) return unauthorized();
  const token = new URL(req.url).searchParams.get("token");
  if (token) {
    await db
      .update(orders)
      .set({ kitchenPrintedAt: new Date() })
      .where(and(eq(orders.id, token), isNull(orders.kitchenPrintedAt)));
  }
  return new NextResponse("", { status: 200 });
}
