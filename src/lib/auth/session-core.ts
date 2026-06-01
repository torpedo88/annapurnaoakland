export type Role = "owner" | "manager" | "staff";
export interface SessionPayload {
  sid: string;
  role: Role;
}
interface SignedPayload extends SessionPayload {
  exp: number; // unix seconds
}

export const SESSION_COOKIE = "annapurna_staff";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(norm);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function secret(): string {
  const s = process.env.STAFF_SESSION_SECRET;
  if (!s) throw new Error("Missing STAFF_SESSION_SECRET");
  return s;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSessionToken(payload: SessionPayload, ttlSeconds: number): Promise<string> {
  const body: SignedPayload = {
    sid: payload.sid,
    role: payload.role,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const data = b64url(enc.encode(JSON.stringify(body)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(data));
  return `${data}.${b64url(sig)}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64url(sig), enc.encode(data));
  } catch {
    return null;
  }
  if (!ok) return null;
  try {
    const body = JSON.parse(new TextDecoder().decode(fromB64url(data))) as SignedPayload;
    if (typeof body.exp !== "number" || body.exp < Math.floor(Date.now() / 1000)) return null;
    if (body.role !== "owner" && body.role !== "manager" && body.role !== "staff") return null;
    if (typeof body.sid !== "string") return null;
    return { sid: body.sid, role: body.role };
  } catch {
    return null;
  }
}
