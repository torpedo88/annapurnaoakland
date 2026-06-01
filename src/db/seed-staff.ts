/**
 * Bootstraps the first owner account from ADMIN_BOOTSTRAP_EMAIL/PASSWORD.
 * Idempotent: does nothing if any owner already exists.
 * Run: npm run db:seed:staff
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) {
    console.error("Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD.");
    process.exit(1);
  }

  const [existingOwner] = await db.select().from(staff).where(eq(staff.role, "owner")).limit(1);
  if (existingOwner) {
    console.log("Owner already exists; nothing to do.");
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  await db.insert(staff).values({ name: "Owner", email, passwordHash, role: "owner" });
  console.log(`Created owner ${email}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed staff failed:", e);
  process.exit(1);
});
