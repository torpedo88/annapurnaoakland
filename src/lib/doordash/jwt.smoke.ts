// Run: DOORDASH_DEVELOPER_ID=d DOORDASH_KEY_ID=k DOORDASH_SIGNING_SECRET=$(node -e "console.log(Buffer.from('secret').toString('base64url'))") DOORDASH_WEBHOOK_SECRET=w RESTAURANT_PICKUP_ADDRESS=a RESTAURANT_PICKUP_PHONE=p npx tsx src/lib/doordash/jwt.smoke.ts
import { createDriveJwt } from "./jwt";
const t = createDriveJwt();
const [h, p] = t.split(".");
const dec = (s: string) => JSON.parse(Buffer.from(s, "base64").toString());
console.assert(dec(h)["dd-ver"] === "DD-JWT-V1", "header dd-ver");
console.assert(dec(p).aud === "doordash", "aud");
console.assert(dec(p).exp - dec(p).iat === 300, "exp window");
console.log("JWT smoke OK:", t.slice(0, 24) + "...");
