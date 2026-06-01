import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;
const SCHEME = "scrypt";

/** Returns a self-describing hash string: `scrypt$<saltHex>$<hashHex>`. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
  return `${SCHEME}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== SCHEME) return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length !== KEYLEN) return false;
  const derived = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
