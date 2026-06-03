/**
 * Per-dish image matching for the Annapurna menu.
 *
 * Images are self-hosted under /public/images/dishes/<key>.jpg, sourced from
 * Wikimedia Commons (each photo is captioned as the named dish, so the label
 * is authoritative) and visually verified. Self-hosting avoids upstream
 * rate-limiting/hotlink breakage and gives next/image a same-origin source.
 *
 * To change a dish photo: drop a new <key>.jpg in public/images/dishes/ and,
 * if needed, adjust the MATCHERS below. Matchers are priority-ordered — first
 * match wins — so keep protein/ingredient-specific rules above generic ones.
 */

const img = (key: string) => `/images/dishes/${key}.jpg`;

type Match = { test: (name: string) => boolean; key: string };

// Every key here corresponds to a file in public/images/dishes/<key>.jpg.
const IMG = {
  // Nepali / appetizers
  momo: img("momo"),
  jholMomo: img("jholMomo"),
  mixedMomo: img("mixedMomo"),
  samosa: img("samosa"),
  vegPakora: img("vegPakora"),
  paneerPakora: img("paneerPakora"),
  fishPakora: img("fishPakora"),
  chhoila: img("chhoila"),

  // Vegetarian
  alooMatar: img("alooMatar"),
  alooGobi: img("alooGobi"),
  chanaMasala: img("chanaMasala"),
  bhindi: img("bhindi"),
  matarPaneer: img("matarPaneer"),
  palakPaneer: img("palakPaneer"),
  malaiKofta: img("malaiKofta"),
  mixVeg: img("mixVeg"),
  alooBhanta: img("alooBhanta"),
  potatoSpinach: img("potatoSpinach"),
  pumpkinMasala: img("pumpkinMasala"),
  paneerTikkaMasala: img("paneerTikkaMasala"),
  vegKorma: img("vegKorma"),
  dalMakhani: img("dalMakhani"),
  dalTadka: img("dalTadka"),

  // Chicken
  butterChicken: img("butterChicken"),
  chickenTikkaMasala: img("chickenTikkaMasala"),
  chickenCurry: img("chickenCurry"),
  chickenChili: img("chickenChili"),
  chickenSpinach: img("chickenSpinach"),
  chickenVindaloo: img("chickenVindaloo"),
  chickenKorma: img("chickenKorma"),
  coconutChicken: img("coconutChicken"),
  chickenTikka: img("chickenTikka"),

  // Lamb & goat
  lambCurry: img("lambCurry"),
  lambTikkaMasala: img("lambTikkaMasala"),
  lambSpinach: img("lambSpinach"),
  lambMushroom: img("lambMushroom"),
  lambVindaloo: img("lambVindaloo"),
  lambKorma: img("lambKorma"),
  goatCurry: img("goatCurry"),

  // Seafood (salmon + shrimp anchors; tandoor variants separate)
  salmonCurry: img("salmonCurry"),
  salmonTandoor: img("salmonTandoor"),
  shrimpKorma: img("shrimpKorma"),
  shrimpTandoor: img("shrimpTandoor"),

  // Tandoori
  tandooriChicken: img("tandooriChicken"),
  mixedTandoori: img("mixedTandoori"),

  // Biryani
  vegBiryani: img("vegBiryani"),
  chickenBiryani: img("chickenBiryani"),
  lambBiryani: img("lambBiryani"),

  // Breads
  plainNaan: img("plainNaan"),
  garlicNaan: img("garlicNaan"),
  onionNaan: img("onionNaan"),
  tandooriRoti: img("tandooriRoti"),
  herbalNaan: img("herbalNaan"),
  paneerParatha: img("paneerParatha"),
  plainParatha: img("plainParatha"),
  onionParatha: img("onionParatha"),
  alooParatha: img("alooParatha"),
  assortedNaan: img("assortedNaan"),

  // Sides
  basmatiRice: img("basmatiRice"),
  brownRice: img("brownRice"),
  papad: img("papad"),
  mangoChutney: img("mangoChutney"),
  mixedPickle: img("mixedPickle"),
  raita: img("raita"),

  // Desserts
  gulabJamun: img("gulabJamun"),
  kheer: img("kheer"),
  mangoKulfi: img("mangoKulfi"),
  rasmalai: img("rasmalai"),

  // Drinks
  chai: img("chai"),
  mangoLassi: img("mangoLassi"),
  plainLassi: img("plainLassi"),
  soda: img("soda"),
  sparklingWater: img("sparklingWater"),
  water: img("water"),
  icedTea: img("icedTea"),
} as const;

const CATEGORY_FALLBACK: Record<string, string> = {
  appetizer: IMG.samosa,
  "vegetarian-dish": IMG.palakPaneer,
  "chicken-dish": IMG.butterChicken,
  "lamb-dishes": IMG.lambCurry,
  "tandoori-dish": IMG.tandooriChicken,
  "sea-foods": IMG.salmonCurry,
  biryani: IMG.chickenBiryani,
  "house-special": IMG.goatCurry,
  breads: IMG.plainNaan,
  "side-order": IMG.basmatiRice,
  dessert: IMG.gulabJamun,
  beverages: IMG.chai,
  "catering-appetizers": IMG.samosa,
  "catering-vegetarian-dish": IMG.palakPaneer,
  "catering-chicken-dish": IMG.butterChicken,
  "catering-lambgoat-dishes": IMG.lambCurry,
  "catering-tandoori-dish": IMG.tandooriChicken,
  "catering-biryani": IMG.chickenBiryani,
  "catering-breads": IMG.plainNaan,
  "catering-side-order": IMG.basmatiRice,
  "catering-dessert": IMG.gulabJamun,
};

// Priority-ordered keyword matchers — first match wins.
const MATCHERS: Match[] = [
  // Momos (specific before generic)
  { test: (n) => /jhol/.test(n) && /momo/.test(n), key: "jholMomo" },
  { test: (n) => /mixed?\s*momo/.test(n), key: "mixedMomo" },
  { test: (n) => /momo/.test(n), key: "momo" },

  // Other appetizers
  { test: (n) => /samosa/.test(n), key: "samosa" },
  { test: (n) => /paneer\s*pakora/.test(n), key: "paneerPakora" },
  { test: (n) => /fish\s*pakora/.test(n), key: "fishPakora" },
  { test: (n) => /pakora|fritter/.test(n), key: "vegPakora" }, // incl. pumpkin/veg pakora
  { test: (n) => /chhoila|choila|chhwela/.test(n), key: "chhoila" },

  // Seafood — match by protein BEFORE generic curry/masala/vindaloo rules
  { test: (n) => /(salmon|fish)\s*tandoor/.test(n) || /tandoor.*salmon/.test(n), key: "salmonTandoor" },
  { test: (n) => /(shrimp|prawn)\s*tandoor/.test(n) || /tandoor.*(shrimp|prawn)/.test(n), key: "shrimpTandoor" },
  { test: (n) => /salmon|fish/.test(n), key: "salmonCurry" },
  { test: (n) => /shrimp|prawn/.test(n), key: "shrimpKorma" },

  // Paneer / vegetarian
  { test: (n) => /palak\s*paneer|saag\s*paneer|spinach.*paneer/.test(n), key: "palakPaneer" },
  { test: (n) => /matar\s*paneer|peas.*paneer/.test(n), key: "matarPaneer" },
  { test: (n) => /paneer\s*tikka|paneer.*masala/.test(n), key: "paneerTikkaMasala" },
  { test: (n) => /malai\s*kofta|kofta/.test(n), key: "malaiKofta" },
  { test: (n) => /chana|chole|garbanzo|chickpea/.test(n), key: "chanaMasala" },
  { test: (n) => /aloo\s*matar|potato.*pea|matar.*aloo/.test(n), key: "alooMatar" },
  { test: (n) => /aloo.*(cauli|gobi)|cauliflower|\bgobi\b/.test(n), key: "alooGobi" },
  { test: (n) => /aloo\s*bhanta|bhanta|baingan|eggplant|brinjal/.test(n), key: "alooBhanta" },
  { test: (n) => /bhindi|okra/.test(n), key: "bhindi" },
  { test: (n) => /pumpkin\s*masala|kaddu/.test(n), key: "pumpkinMasala" },
  { test: (n) => /(veg|vegetable)\s*korma|navratan/.test(n), key: "vegKorma" },
  { test: (n) => /mix(ed)?\s*veg/.test(n), key: "mixVeg" },
  { test: (n) => /dal\s*makhani|daal\s*makhani/.test(n), key: "dalMakhani" },
  { test: (n) => /dal\s*tadka|dal\s*fry|daal/.test(n), key: "dalTadka" },

  // Chicken (protein-specific spinach/vindaloo before lamb/generic)
  { test: (n) => /butter\s*chicken|chicken.*nauni|chicken.*makhani|murgh.*makhani/.test(n), key: "butterChicken" },
  { test: (n) => /coconut.*chicken|chicken.*coconut/.test(n), key: "coconutChicken" },
  { test: (n) => /chicken.*tikka\s*masala|chicken.*masala/.test(n), key: "chickenTikkaMasala" },
  { test: (n) => /chicken.*korma/.test(n), key: "chickenKorma" },
  { test: (n) => /chicken.*vindaloo/.test(n), key: "chickenVindaloo" },
  { test: (n) => /chicken.*(chili|chilli)|(chili|chilli).*chicken/.test(n), key: "chickenChili" },
  { test: (n) => /chicken.*(spinach|saag|palak)/.test(n), key: "chickenSpinach" },
  { test: (n) => /chicken.*tandoori\s*tikka|tandoori.*chicken.*tikka/.test(n), key: "chickenTikka" },
  { test: (n) => /chicken.*tikka/.test(n), key: "chickenTikka" },

  // Lamb / goat
  { test: (n) => /lamb.*tikka\s*masala|lamb.*masala/.test(n), key: "lambTikkaMasala" },
  { test: (n) => /lamb.*korma/.test(n), key: "lambKorma" },
  { test: (n) => /lamb.*vindaloo/.test(n), key: "lambVindaloo" },
  { test: (n) => /lamb.*(spinach|saag|palak)/.test(n), key: "lambSpinach" },
  { test: (n) => /lamb.*mushroom|mushroom.*lamb/.test(n), key: "lambMushroom" },
  { test: (n) => /goat/.test(n), key: "goatCurry" },

  // Tandoori
  { test: (n) => /mixed?\s*tandoor|tandoori?\s*(platter|mix)/.test(n), key: "mixedTandoori" },
  { test: (n) => /tandoori?\s*roti/.test(n), key: "tandooriRoti" },
  { test: (n) => /tandoor/.test(n), key: "tandooriChicken" },

  // Biryani
  { test: (n) => /lamb\s*biryani|goat\s*biryani|mutton\s*biryani/.test(n), key: "lambBiryani" },
  { test: (n) => /chicken\s*biryani/.test(n), key: "chickenBiryani" },
  { test: (n) => /biryani/.test(n), key: "vegBiryani" },

  // Generic chicken/lamb curry (after all specific protein dishes)
  { test: (n) => /chicken/.test(n), key: "chickenCurry" },
  { test: (n) => /lamb|mutton/.test(n), key: "lambCurry" },

  // Breads (specific before plain)
  { test: (n) => /garlic\s*naan/.test(n), key: "garlicNaan" },
  { test: (n) => /onion\s*naan/.test(n), key: "onionNaan" },
  { test: (n) => /(herb|herbal|rosemary)\s*naan/.test(n), key: "herbalNaan" },
  { test: (n) => /assorted\s*naan|naan\s*basket/.test(n), key: "assortedNaan" },
  { test: (n) => /naan/.test(n), key: "plainNaan" }, // incl. coconut naan
  { test: (n) => /paneer\s*paratha/.test(n), key: "paneerParatha" },
  { test: (n) => /(aloo|alu|aalo)\s*paratha/.test(n), key: "alooParatha" },
  { test: (n) => /onion\s*paratha/.test(n), key: "onionParatha" },
  { test: (n) => /paratha/.test(n), key: "plainParatha" }, // incl. coconut paratha
  { test: (n) => /roti|chapati/.test(n), key: "tandooriRoti" },

  // Sides
  { test: (n) => /raita/.test(n), key: "raita" },
  { test: (n) => /brown\s*rice/.test(n), key: "brownRice" },
  { test: (n) => /rice|basmati/.test(n), key: "basmatiRice" },
  { test: (n) => /papad|papp?adum/.test(n), key: "papad" },
  { test: (n) => /mango\s*chutney/.test(n), key: "mangoChutney" },
  { test: (n) => /pickle|achar/.test(n), key: "mixedPickle" },
  { test: (n) => /lentil\s*soup|\bdal\b|\bdaal\b|lentil/.test(n), key: "dalTadka" },
  { test: (n) => /chutney/.test(n), key: "mangoChutney" },

  // Desserts
  { test: (n) => /gulab\s*jamun/.test(n), key: "gulabJamun" },
  { test: (n) => /rasmalai|ras\s*malai/.test(n), key: "rasmalai" },
  { test: (n) => /kheer|rice\s*pudding/.test(n), key: "kheer" },
  { test: (n) => /kulfi/.test(n), key: "mangoKulfi" },

  // Drinks (iced tea before tea/chai)
  { test: (n) => /iced\s*tea/.test(n), key: "icedTea" },
  { test: (n) => /mango\s*lassi/.test(n), key: "mangoLassi" },
  { test: (n) => /lassi/.test(n), key: "plainLassi" },
  { test: (n) => /chai|masala\s*tea|\btea\b/.test(n), key: "chai" },
  { test: (n) => /sparkling/.test(n), key: "sparklingWater" },
  { test: (n) => /soda|coke|pepsi|sprite|cola/.test(n), key: "soda" },
  { test: (n) => /water/.test(n), key: "water" },
];

export function dishImage(name: string, category: string): string {
  const n = name.toLowerCase();
  for (const m of MATCHERS) {
    if (m.test(n)) return (IMG as Record<string, string>)[m.key] ?? IMG.chickenCurry;
  }
  return CATEGORY_FALLBACK[category] ?? IMG.butterChicken;
}
