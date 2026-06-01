import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
  type Role,
} from "./session-core";

// Re-export the pure API so existing imports of "@/lib/auth/session" keep working.
export * from "./session-core";

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
