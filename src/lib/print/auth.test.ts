import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { verifyPrintToken, getBearerToken } from "./auth";

function reqWith(auth?: string): Request {
  return new Request("http://localhost/api/print/pending", auth ? { headers: { authorization: auth } } : undefined);
}

describe("getBearerToken", () => {
  it("extracts the token from a Bearer header", () => {
    expect(getBearerToken(reqWith("Bearer abc123"))).toBe("abc123");
  });
  it("returns null without a header", () => {
    expect(getBearerToken(reqWith())).toBeNull();
  });
});

describe("verifyPrintToken", () => {
  const previous = process.env.PRINT_BRIDGE_TOKEN;
  beforeEach(() => { process.env.PRINT_BRIDGE_TOKEN = "secret-123"; });
  afterEach(() => {
    if (previous === undefined) delete process.env.PRINT_BRIDGE_TOKEN;
    else process.env.PRINT_BRIDGE_TOKEN = previous;
  });

  it("accepts the correct token", () => {
    expect(verifyPrintToken(reqWith("Bearer secret-123"))).toBe(true);
  });
  it("rejects a wrong token", () => {
    expect(verifyPrintToken(reqWith("Bearer nope"))).toBe(false);
  });
  it("rejects a missing header", () => {
    expect(verifyPrintToken(reqWith())).toBe(false);
  });
  it("denies when PRINT_BRIDGE_TOKEN is not configured", () => {
    delete process.env.PRINT_BRIDGE_TOKEN;
    expect(verifyPrintToken(reqWith("Bearer secret-123"))).toBe(false);
  });
});
