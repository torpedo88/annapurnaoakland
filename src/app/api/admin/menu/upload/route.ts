import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireRole, AuthError } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// Staff upload a dish photo → Supabase Storage (public `dish-images` bucket) →
// returns the public URL. The caller stores that URL in menu_items.imageUrl.
// Uses the service role key server-side (never exposed to the client).
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    await requireRole(["owner", "manager"]);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: e instanceof AuthError ? 401 : 500 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  const ext = MIME_EXT[file.type];
  if (!ext) return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 400 });

  const { url, serviceKey } = env.supabase();
  const objectName = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const up = await fetch(`${url}/storage/v1/object/dish-images/${objectName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: bytes,
  });

  if (!up.ok) {
    console.error("[menu upload] storage error", up.status, await up.text());
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }

  return NextResponse.json({ url: `${url}/storage/v1/object/public/dish-images/${objectName}` });
}
