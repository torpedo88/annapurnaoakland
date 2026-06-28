import { timingSafeEqual } from "crypto";

// The print bridge (a dedicated Android tablet) authenticates with a single
// shared bearer token, PRINT_BRIDGE_TOKEN. This scopes it to the /api/print/*
// endpoints only — it is NOT a staff session. Compared in constant time.

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1]!.trim() : null;
}

export function verifyPrintToken(req: Request): boolean {
  const expected = process.env.PRINT_BRIDGE_TOKEN;
  // Deny when unconfigured — never allow an empty/undefined token to pass.
  if (!expected) return false;
  const got = getBearerToken(req);
  if (!got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
