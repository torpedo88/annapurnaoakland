import { describe, it, expect, beforeAll } from "vitest";
import { signSessionToken, verifySessionToken, type SessionPayload } from "@/lib/auth/session";

beforeAll(() => {
  process.env.STAFF_SESSION_SECRET = "test-secret-please-change";
});

const base: SessionPayload = { sid: "abc", role: "owner" };

describe("session token", () => {
  it("round-trips a valid token", async () => {
    const token = await signSessionToken(base, 3600);
    const out = await verifySessionToken(token);
    expect(out?.sid).toBe("abc");
    expect(out?.role).toBe("owner");
  });

  it("rejects a tampered token", async () => {
    const token = await signSessionToken(base, 3600);
    // Corrupt the first char of the payload segment — deterministically changes
    // the signed content so the HMAC no longer matches.
    const first = token[0] === "a" ? "b" : "a";
    const tampered = first + token.slice(1);
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSessionToken(base, -1); // already expired
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifySessionToken("nonsense")).toBeNull();
  });
});
