import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function decodeSecret(secret: string): Buffer {
  // DoorDash signing secret is URL-safe base64.
  const norm = secret.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(norm, "base64");
}

/** Returns a short-lived (5 min) Drive JWT. */
export function createDriveJwt(): string {
  const { developerId, keyId, signingSecret } = env.doordash();
  const header = { alg: "HS256", typ: "JWT", "dd-ver": "DD-JWT-V1" };
  const iat = Math.floor(Date.now() / 1000);
  const payload = { aud: "doordash", iss: developerId, kid: keyId, iat, exp: iat + 300 };
  const signingInput =
    b64url(Buffer.from(JSON.stringify(header))) + "." + b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac("sha256", decodeSecret(signingSecret)).update(signingInput).digest());
  return `${signingInput}.${sig}`;
}
