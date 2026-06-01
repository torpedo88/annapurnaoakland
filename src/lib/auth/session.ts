import { cookies } from "next/headers";

export type Role = "owner" | "manager" | "staff";
export interface SessionPayload {
  sid: string;
  role: Role;
}
interface SignedPayload extends SessionPayload {
  exp: number; // unix seconds
}

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

/** Sign `{sid, role}` with a TTL (seconds). Returns `<payloadB64>.<sigB64>`. */
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

export const SESSION_COOKIE = "annapurna_staff";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload, SESSION_TTL_SECONDS);
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Reads + verifies the session cookie. Returns null if absent/invalid/expired. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export class AuthError extends Error {}

/** Throws AuthError if no session or role not allowed. Returns the session otherwise. */
export async function requireRole(allowed: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated");
  if (!allowed.includes(session.role)) throw new AuthError("Forbidden");
  return session;
}
