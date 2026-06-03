import { readFile, writeFile } from "node:fs/promises";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT = "public/images/dishes";
// DoorDash item name -> our image key (DoorDash wins; new granularity keys added)
const KEY = {
  "Aloo Matar": "alooMatar",
  "Butter Chicken": "butterChicken",
  "Chicken Momo": "chickenMomo",
  "Chicken Tikka Masala": "chickenTikkaMasala",
  "Garlic Naan": "garlicNaan",
  "Lamb Momo": "lambMomo",
  "Malai Kofta": "malaiKofta",
  "Mango Lassi": "mangoLassi",
  "Matar Paneer": "matarPaneer",
  "Mixed Momo": "mixedMomo",
  "Palak Paneer": "palakPaneer",
  "Plain Naan": "plainNaan",
  "Salmon Curry": "salmonCurry",
  "Salmon Tikka Masala": "salmonTikkaMasala",
  "Salmon Vindaloo": "salmonVindaloo",
  "Shrimp Korma": "shrimpKorma",
  "Shrimp Tikka Masala": "shrimpTikkaMasala",
  "Veg Samosa": "samosa",
};
const { map } = JSON.parse(await readFile("scripts/doordash-menu-map.json", "utf8"));
let ok = 0; const fails = [];
for (const [name, key] of Object.entries(KEY)) {
  const url = map[name];
  if (!url) { fails.push(`${name}: no url`); continue; }
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 3000) throw new Error(`too small ${buf.length}`);
    await writeFile(`${OUT}/${key}.jpg`, buf); // always .jpg even if source png — next/image handles by content
    console.log(`ok  ${name}  ->  ${key}.jpg  ${(buf.length/1024).toFixed(0)}KB`);
    ok++;
  } catch (e) { fails.push(`${name}: ${e.message}`); }
  await new Promise(r => setTimeout(r, 150));
}
console.log(`\nDONE ${ok}/${Object.keys(KEY).length}`);
if (fails.length) console.log("FAILS:\n" + fails.join("\n"));
