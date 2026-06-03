// One-off: download correctly-labeled Wikimedia Commons dish photos into
// public/images/dishes/<key>.jpg. Throttled + UA to avoid upload.wikimedia 429s.
import { mkdir, writeFile } from "node:fs/promises";

const UA = "AnnapurnaOaklandBot/1.0 (https://annapurnaoakland.vercel.app; amaharjan08@gmail.com)";
const OUT = "public/images/dishes";

// key -> Commons image URL (chosen by per-dish research, all HEAD-verified 200)
const M = {
  // Momos & appetizers
  momo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Steamed_Momos_-_KOLKATA.jpg/960px-Steamed_Momos_-_KOLKATA.jpg",
  jholMomo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Jhol_Momo.jpg/960px-Jhol_Momo.jpg",
  mixedMomo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Veg_Momo_1.jpg/960px-Veg_Momo_1.jpg",
  samosa: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Samosa_with_Chutney.jpg/960px-Samosa_with_Chutney.jpg",
  vegPakora: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Vegetable_Pakora_-_Simurali_2015-01-30_5526.JPG/960px-Vegetable_Pakora_-_Simurali_2015-01-30_5526.JPG",
  paneerPakora: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Paneer_Pakoras.jpg/960px-Paneer_Pakoras.jpg",
  fishPakora: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Fish_Pakora_-_Kolkata_2013-10-11_3292.JPG/960px-Fish_Pakora_-_Kolkata_2013-10-11_3292.JPG",
  chhoila: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Kukhura_Ko_Chhoila.jpg/960px-Kukhura_Ko_Chhoila.jpg",

  // Vegetarian
  alooMatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Aloo_matar.jpg/960px-Aloo_matar.jpg",
  alooGobi: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Aloo_gobi.jpg/960px-Aloo_gobi.jpg",
  chanaMasala: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Simple_chana_masala.jpg/960px-Simple_chana_masala.jpg",
  bhindi: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Bhindi_Masala.jpg/960px-Bhindi_Masala.jpg",
  matarPaneer: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Matar_Paneer_2.jpg/960px-Matar_Paneer_2.jpg",
  palakPaneer: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Palak_Paneer_curry_on_plate.jpg/960px-Palak_Paneer_curry_on_plate.jpg",
  malaiKofta: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Malai_kofta.jpg/960px-Malai_kofta.jpg",
  mixVeg: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Mixed_Vegetable_Curry_-_Kolkata_2014-02-13_2644.JPG/960px-Mixed_Vegetable_Curry_-_Kolkata_2014-02-13_2644.JPG",
  alooBhanta: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Baingan_Bharta.JPG/960px-Baingan_Bharta.JPG",
  potatoSpinach: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Aloo_Palak_%28Spinach_with_Potatoes%29.JPG/960px-Aloo_Palak_%28Spinach_with_Potatoes%29.JPG",
  pumpkinMasala: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Pumpkin_Curry_%28Kaddu_Ki_Sabzi%29.JPG/960px-Pumpkin_Curry_%28Kaddu_Ki_Sabzi%29.JPG",
  paneerTikkaMasala: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Paneer_Tikka_Masala.jpg/960px-Paneer_Tikka_Masala.jpg",
  vegKorma: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Vegetable_Korma_03.jpg/960px-Vegetable_Korma_03.jpg",
  dalMakhani: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Dal_Makhani_01.jpg/960px-Dal_Makhani_01.jpg",
  dalTadka: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Dal_Tadka-Delhi.jpg/960px-Dal_Tadka-Delhi.jpg",

  // Chicken
  butterChicken: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Chicken_makhani.jpg/960px-Chicken_makhani.jpg",
  chickenTikkaMasala: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Chicken_tikka_masala.jpg/960px-Chicken_tikka_masala.jpg",
  chickenCurry: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Chicken_Curry_4.jpg/960px-Chicken_Curry_4.jpg",
  chickenChili: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Chilli_chicken_Kerala.jpg/960px-Chilli_chicken_Kerala.jpg",
  chickenSpinach: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Palak_Chicken.jpg/960px-Palak_Chicken.jpg",
  chickenVindaloo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Chicken_Vindaloo_%2814971587940%29.jpg/960px-Chicken_Vindaloo_%2814971587940%29.jpg",
  chickenKorma: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Chicken_Korma.JPG/960px-Chicken_Korma.JPG",
  coconutChicken: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Chicken_Coconut_Curry.jpg/960px-Chicken_Coconut_Curry.jpg",
  chickenTikka: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Chicken-Tikka.jpg/960px-Chicken-Tikka.jpg",

  // Lamb / goat
  lambCurry: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Rogan_josh02.jpg/960px-Rogan_josh02.jpg",
  lambTikkaMasala: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Chicken_Tikka_Masala_on_White_Plate_with_Spoon.jpg/960px-Chicken_Tikka_Masala_on_White_Plate_with_Spoon.jpg",
  lambSpinach: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Palak_Gosht.JPG/960px-Palak_Gosht.JPG",
  lambMushroom: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Mutton_rogan_josh.jpg/960px-Mutton_rogan_josh.jpg",
  lambVindaloo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Lamb_vindaloo_in_Helsinki.jpg/960px-Lamb_vindaloo_in_Helsinki.jpg",
  lambKorma: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Lamb_korma_%288855526410%29.jpg/960px-Lamb_korma_%288855526410%29.jpg",
  goatCurry: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Goat_Curry%2C_rice_and_naan.jpg/960px-Goat_Curry%2C_rice_and_naan.jpg",

  // Seafood
  salmonCurry: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Rawas_Indian_salmon_curry_-_Bangalore_-_Karnataka.jpg/960px-Rawas_Indian_salmon_curry_-_Bangalore_-_Karnataka.jpg",
  salmonVindaloo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Fish-curry-rice%2C_Goan-style_02.jpg/960px-Fish-curry-rice%2C_Goan-style_02.jpg",
  salmonTikkaMasala: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Tandoori_Fish_tikka.jpg",
  shrimpKorma: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/King_prawn_curry_-_Sunoso.jpg/960px-King_prawn_curry_-_Sunoso.jpg",
  shrimpVindaloo: "https://upload.wikimedia.org/wikipedia/commons/8/84/PrawnVindahloo.jpg",
  shrimpTikkaMasala: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Prawns_Masala_Recipe.jpg/960px-Prawns_Masala_Recipe.jpg",

  // Tandoori
  tandooriChicken: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Tandoori_Chicken_1.JPG/960px-Tandoori_Chicken_1.JPG",
  mixedTandoori: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Tandoori_Platter.jpg/960px-Tandoori_Platter.jpg",
  salmonTandoor: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Tandoori_fish.jpg/960px-Tandoori_fish.jpg",
  shrimpTandoor: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Tandoori_Prawns_Jhinga.jpg",

  // Biryani
  vegBiryani: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Vegetable_Biryani_001.JPG/960px-Vegetable_Biryani_001.JPG",
  chickenBiryani: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Chicken_Biryani_4.jpg/960px-Chicken_Biryani_4.jpg",
  lambBiryani: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Mutton_biryani_made_with_lamb.jpg/960px-Mutton_biryani_made_with_lamb.jpg",

  // Breads
  plainNaan: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Naan_2.jpg/960px-Naan_2.jpg",
  garlicNaan: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Garlic_naan_1.jpg/960px-Garlic_naan_1.jpg",
  onionNaan: "https://upload.wikimedia.org/wikipedia/commons/8/85/Kulcha%2C_Indian_stuffed_bread.jpg",
  tandooriRoti: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Tandoori-roti.jpg/960px-Tandoori-roti.jpg",
  herbalNaan: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/2020-02-22_20_57_14_Mixed_herb_and_cheese_naan_bread_at_Karma_Modern_Indian_in_Washington%2C_D.C.jpg/960px-2020-02-22_20_57_14_Mixed_herb_and_cheese_naan_bread_at_Karma_Modern_Indian_in_Washington%2C_D.C.jpg",
  paneerParatha: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Awadhi_palak_paneer_paratha_dahi.jpg",
  plainParatha: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Paratha_is_a_dough_fried_flatbread_native_to_India_and_Pakistan.jpg/960px-Paratha_is_a_dough_fried_flatbread_native_to_India_and_Pakistan.jpg",
  onionParatha: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Onion_Paratha_With_Curd.jpg",
  alooParatha: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Aloo_Paratha_North_Indian.jpg",
  assortedNaan: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Naan-and-Curry-1.jpg/960px-Naan-and-Curry-1.jpg",

  // Sides
  basmatiRice: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Cooked_basmati_rice_in_a_pot%2C_absorption_method%2C_fluffed.jpg/960px-Cooked_basmati_rice_in_a_pot%2C_absorption_method%2C_fluffed.jpg",
  brownRice: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Par_cooked_brown_rice_-_stonesoup_cropped.jpg",
  papad: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Stack_of_papadums.jpg/960px-Stack_of_papadums.jpg",
  mangoChutney: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Mango_chutney_in_West_Bengal%2C_India.jpg/960px-Mango_chutney_in_West_Bengal%2C_India.jpg",
  mixedPickle: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Indian-pickle.jpg",
  raita: "https://upload.wikimedia.org/wikipedia/commons/9/90/Raita_with_cucumber_and_mint.jpg",

  // Desserts
  gulabJamun: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Two_Gulab_Jamun_in_a_plate_01.jpg/960px-Two_Gulab_Jamun_in_a_plate_01.jpg",
  kheer: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Kheer.jpg/960px-Kheer.jpg",
  mangoKulfi: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Mango_Kulfi.jpg/960px-Mango_Kulfi.jpg",
  rasmalai: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Rasmalai_Dessert.jpg/960px-Rasmalai_Dessert.jpg",

  // Drinks
  chai: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Masala_Chai.JPG/960px-Masala_Chai.JPG",
  mangoLassi: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mango_Lassi_.jpg/960px-Mango_Lassi_.jpg",
  plainLassi: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Lassi_1.jpg/960px-Lassi_1.jpg",
  soda: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mexicoke.jpg/960px-Mexicoke.jpg",
  sparklingWater: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Sparkling_Water_with_Mint_in_Glass_Cup.jpg/960px-Sparkling_Water_with_Mint_in_Glass_Cup.jpg",
  water: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Glass_of_water%2C_detail.jpg",
  icedTea: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Iced_tea_with_ice_cubes.jpg/960px-Iced_tea_with_ice_cubes.jpg",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mkdir(OUT, { recursive: true });
const keys = Object.keys(M);
let ok = 0;
const fails = [];
for (const key of keys) {
  let done = false;
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    try {
      const res = await fetch(M[key], { headers: { "User-Agent": UA, Referer: "https://annapurnaoakland.vercel.app/" } });
      if (res.status === 429) { await sleep(1500 * attempt); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) throw new Error(`too small ${buf.length}`);
      await writeFile(`${OUT}/${key}.jpg`, buf);
      console.log(`ok  ${key}  ${(buf.length / 1024).toFixed(0)}KB`);
      ok++; done = true;
    } catch (e) {
      if (attempt === 3) { fails.push(`${key}: ${e.message}`); }
      else await sleep(800 * attempt);
    }
  }
  await sleep(250); // throttle
}
console.log(`\nDONE ${ok}/${keys.length} downloaded`);
if (fails.length) { console.log("FAILS:\n" + fails.join("\n")); process.exitCode = 1; }
