import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  doordash: () => ({
    developerId: required("DOORDASH_DEVELOPER_ID"),
    keyId: required("DOORDASH_KEY_ID"),
    signingSecret: required("DOORDASH_SIGNING_SECRET"),
    webhookSecret: required("DOORDASH_WEBHOOK_SECRET"),
  }),
  restaurant: () => ({
    pickupAddress: required("RESTAURANT_PICKUP_ADDRESS"),
    pickupPhone: required("RESTAURANT_PICKUP_PHONE"),
  }),
  baseUrl: () => process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  staffSessionSecret: () => required("STAFF_SESSION_SECRET"),
  stripe: () => ({
    secretKey: required("STRIPE_SECRET_KEY"),
    webhookSecret: required("STRIPE_WEBHOOK_SECRET"),
  }),
};
