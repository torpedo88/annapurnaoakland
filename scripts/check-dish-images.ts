import { existsSync } from "node:fs";
import { menu } from "@/data/menu";
const miss = new Map<string, string | undefined>();
let ok = 0;
for (const it of menu) {
  const p = `public${it.image ?? ""}`;
  if (!it.image || !existsSync(p)) miss.set(it.name, it.image);
  else ok++;
}
console.log(`resolved+exists: ${ok}/${menu.length}`);
if (miss.size) { console.log("MISSING:"); for (const [n, u] of miss) console.log(`  ${n} -> ${u}`); }
const dist = new Map<string, number>();
for (const it of menu) dist.set(it.image, (dist.get(it.image) || 0) + 1);
console.log(`distinct images in use: ${dist.size}`);
