/**
 * Per-dish image matching for the Annapurna menu.
 *
 * Sources (all URLs HEAD-verified):
 *  - TheMealDB — stable stock photos of named Indian meals
 *  - Unsplash — verified photo IDs for common Nepali/Indian dishes
 *
 * Wikipedia Commons was evaluated but upload.wikimedia.org rate-limits
 * non-browser clients and breaks when served from dev servers, so it's
 * excluded here.
 */

type Match = { test: (name: string) => boolean; url: string };

const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&q=85&auto=format&fit=crop`;
const mealdb = (path: string) => `https://www.themealdb.com/images/media/meals/${path}`;

const IMG = {
  // Nepali
  jholMomo: unsplash("photo-1625398407796-82650a8c135f"),             // verified: momo in red broth
  momo: unsplash("photo-1625398407796-82650a8c135f"),                 // same family
  momoPlate: unsplash("photo-1625398407796-82650a8c135f"),
  chhoila: unsplash("photo-1599487488170-d11ec9c172f0"),              // charred chicken

  // Appetizers
  samosa: unsplash("photo-1601050690597-df0568f70950"),               // verified: samosas
  pakora: unsplash("photo-1606491956689-2ea866880c84"),
  paneerPakora: unsplash("photo-1567188040759-fb8a883dc6d8"),         // paneer cubes

  // Vegetarian
  palakPaneer: unsplash("photo-1631452180519-c014fe946bc7"),          // green paneer curry
  matarPaneer: mealdb("xxpqsy1511452222.jpg"),                        // verified Matar Paneer
  paneerTikka: unsplash("photo-1567188040759-fb8a883dc6d8"),
  chanaMasala: mealdb("sywrsu1511463066.jpg"),                        // Kidney Bean Curry
  malaiKofta: unsplash("photo-1585937421612-70a008356fbe"),
  alooMatar: unsplash("photo-1565557623262-b51c2513a641"),
  alooGobi: mealdb("urtpqw1487341253.jpg"),                           // Baingan Bharta (veg wet curry)
  alooBhanta: mealdb("urtpqw1487341253.jpg"),                         // same Baingan Bharta
  bhindi: unsplash("photo-1565557623262-b51c2513a641"),
  mixVeg: unsplash("photo-1565557623262-b51c2513a641"),
  potatoSpinach: unsplash("photo-1631452180519-c014fe946bc7"),
  pumpkinMasala: unsplash("photo-1506368083636-6defb67639a7"),
  vegKorma: unsplash("photo-1585937421612-70a008356fbe"),
  dalMakhani: mealdb("wuxrtu1483564410.jpg"),                         // verified Dal Fry
  dalTadka: mealdb("wuxrtu1483564410.jpg"),

  // Chicken
  butterChicken: unsplash("photo-1603894584373-5ac82b2ae398"),        // verified: creamy chicken
  chickenTikkaMasala: unsplash("photo-1585937421612-70a008356fbe"),
  chickenTikka: unsplash("photo-1599487488170-d11ec9c172f0"),
  chickenCurry: mealdb("wyxwsp1486979827.jpg"),                       // verified Chicken Handi
  chickenKorma: mealdb("yxsurp1511304301.jpg"),                       // verified Nutty Chicken Curry
  chickenChili: unsplash("photo-1585937421612-70a008356fbe"),
  chickenSpinach: unsplash("photo-1631452180519-c014fe946bc7"),
  chickenVindaloo: unsplash("photo-1585937421612-70a008356fbe"),
  coconutChicken: unsplash("photo-1603894584373-5ac82b2ae398"),

  // Lamb & goat
  lambCurry: mealdb("vvstvq1487342592.jpg"),                          // verified Rogan Josh
  lambVindaloo: mealdb("vvstvq1487342592.jpg"),
  lambBiryani: mealdb("xrttsx1487339558.jpg"),                        // verified Lamb Biryani
  goatCurry: mealdb("vvstvq1487342592.jpg"),

  // Tandoori
  tandooriChicken: mealdb("qptpvt1487339892.jpg"),                    // verified Tandoori Chicken
  seekhKebab: unsplash("photo-1599487488170-d11ec9c172f0"),
  tandooriMixed: mealdb("qptpvt1487339892.jpg"),

  // Seafood
  fishCurry: mealdb("uwxusv1487344500.jpg"),                          // verified Recheado Masala Fish
  fishFry: mealdb("uwxusv1487344500.jpg"),
  shrimpCurry: unsplash("photo-1631292784640-2b24be784d5d"),

  // Biryani
  biryani: mealdb("xrttsx1487339558.jpg"),
  chickenBiryani: mealdb("xrttsx1487339558.jpg"),
  vegBiryani: mealdb("xrttsx1487339558.jpg"),

  // Breads
  naan: unsplash("photo-1617692855027-33b14f061079"),                 // verified bread
  garlicNaan: unsplash("photo-1617692855027-33b14f061079"),
  roti: unsplash("photo-1617692855027-33b14f061079"),
  kulcha: unsplash("photo-1617692855027-33b14f061079"),
  paratha: unsplash("photo-1617692855027-33b14f061079"),
  aaluParatha: unsplash("photo-1617692855027-33b14f061079"),

  // Sides
  rice: unsplash("photo-1596560548464-f010549b84d7"),                 // verified rice bowl
  raita: unsplash("photo-1568454537842-d933259bb258"),                // verified white dairy bowl
  fries: unsplash("photo-1573080496219-bb080dd4f877"),
  chutney: unsplash("photo-1565557623262-b51c2513a641"),

  // Desserts
  gulabJamun: unsplash("photo-1587314168485-3236d6710814"),           // sweet syrupy bowl
  kheer: unsplash("photo-1587314168485-3236d6710814"),
  kulfi: unsplash("photo-1570197571499-166b36435e9f"),                // verified
  rasmalai: unsplash("photo-1587314168485-3236d6710814"),

  // Drinks
  chai: unsplash("photo-1545579133-99bb5ab189bd"),                    // verified warm drink
  mangoLassi: unsplash("photo-1608897013039-887f21d8c804"),           // verified yellow drink
  lassi: unsplash("photo-1568454537842-d933259bb258"),                // verified white drink
  coffee: unsplash("photo-1497935586351-b67a49e012bf"),               // verified coffee
  soda: unsplash("photo-1527960471264-932f39eb5846"),                 // verified soda
  juice: unsplash("photo-1621263764928-df1444c5e859"),                // verified juice
};

const CATEGORY_FALLBACK: Record<string, string> = {
  appetizer: IMG.samosa,
  "vegetarian-dish": IMG.palakPaneer,
  "chicken-dish": IMG.butterChicken,
  "lamb-dishes": IMG.lambCurry,
  "tandoori-dish": IMG.tandooriChicken,
  "sea-foods": IMG.fishCurry,
  biryani: IMG.biryani,
  "house-special": IMG.butterChicken,
  breads: IMG.naan,
  "side-order": IMG.rice,
  dessert: IMG.kheer,
  beverages: IMG.chai,
  "catering-appetizers": IMG.samosa,
  "catering-vegetarian-dish": IMG.palakPaneer,
  "catering-chicken-dish": IMG.butterChicken,
  "catering-lambgoat-dishes": IMG.lambCurry,
  "catering-tandoori-dish": IMG.tandooriChicken,
  "catering-biryani": IMG.biryani,
  "catering-breads": IMG.naan,
  "catering-side-order": IMG.rice,
  "catering-dessert": IMG.kheer,
};

// Priority-ordered keyword matchers — first match wins
const MATCHERS: Match[] = [
  { test: (n) => /jhol.*momo|momo.*jhol/.test(n), url: IMG.jholMomo },
  { test: (n) => /mixed.*momo/.test(n), url: IMG.momoPlate },
  { test: (n) => /momo/.test(n), url: IMG.momo },

  { test: (n) => /samosa/.test(n), url: IMG.samosa },
  { test: (n) => /paneer.*pakora/.test(n), url: IMG.paneerPakora },
  { test: (n) => /pakora|fritter/.test(n), url: IMG.pakora },
  { test: (n) => /chhoila|choila/.test(n), url: IMG.chhoila },

  { test: (n) => /palak|spinach.*paneer|saag.*paneer/.test(n), url: IMG.palakPaneer },
  { test: (n) => /matar.*paneer|peas.*paneer/.test(n), url: IMG.matarPaneer },
  { test: (n) => /paneer.*tikka|tikka.*paneer/.test(n), url: IMG.paneerTikka },
  { test: (n) => /paneer/.test(n), url: IMG.paneerTikka },
  { test: (n) => /malai.*kofta/.test(n), url: IMG.malaiKofta },
  { test: (n) => /chana|garbanzo|chickpea|chole/.test(n), url: IMG.chanaMasala },
  { test: (n) => /aloo.*matar|potato.*pea/.test(n), url: IMG.alooMatar },
  { test: (n) => /aloo.*cauli|aloo.*gobi|cauliflower/.test(n), url: IMG.alooGobi },
  { test: (n) => /aloo.*bhanta|bhanta|baingan|eggplant/.test(n), url: IMG.alooBhanta },
  { test: (n) => /potato.*spinach|spinach.*potato/.test(n), url: IMG.potatoSpinach },
  { test: (n) => /bhindi|okra/.test(n), url: IMG.bhindi },
  { test: (n) => /pumpkin/.test(n), url: IMG.pumpkinMasala },
  { test: (n) => /mix.*vegetable|mixed.*vegetable|seasonal.*veg/.test(n), url: IMG.mixVeg },
  { test: (n) => /(veg|vegetable).*korma/.test(n), url: IMG.vegKorma },
  { test: (n) => /dal.*makhani|daal.*makhani/.test(n), url: IMG.dalMakhani },
  { test: (n) => /\bdal\b|\bdaal\b|lentil/.test(n), url: IMG.dalTadka },

  { test: (n) => /butter.*chicken|chicken.*nauni|chicken.*makhani/.test(n), url: IMG.butterChicken },
  { test: (n) => /tikka.*masala/.test(n), url: IMG.chickenTikkaMasala },
  { test: (n) => /chicken.*tikka/.test(n), url: IMG.chickenTikka },
  { test: (n) => /chicken.*korma|nutty.*chicken/.test(n), url: IMG.chickenKorma },
  { test: (n) => /chicken.*vindaloo/.test(n), url: IMG.chickenVindaloo },
  { test: (n) => /chicken.*chili|chili.*chicken/.test(n), url: IMG.chickenChili },
  { test: (n) => /chicken.*spinach|chicken.*saag|chicken.*palak/.test(n), url: IMG.chickenSpinach },
  { test: (n) => /coconut.*chicken|chicken.*coconut/.test(n), url: IMG.coconutChicken },
  { test: (n) => /chicken.*curry|curry.*chicken/.test(n), url: IMG.chickenCurry },

  { test: (n) => /lamb.*biryani|goat.*biryani/.test(n), url: IMG.lambBiryani },
  { test: (n) => /lamb.*vindaloo|goat.*vindaloo/.test(n), url: IMG.lambVindaloo },
  { test: (n) => /lamb|goat|mutton/.test(n), url: IMG.lambCurry },

  { test: (n) => /tandoori.*mix|mixed.*tandoori|tandoori.*platter/.test(n), url: IMG.tandooriMixed },
  { test: (n) => /seekh|kebab/.test(n), url: IMG.seekhKebab },
  { test: (n) => /tandoori/.test(n), url: IMG.tandooriChicken },

  { test: (n) => /shrimp|prawn/.test(n), url: IMG.shrimpCurry },
  { test: (n) => /fish.*fry|fried.*fish/.test(n), url: IMG.fishFry },
  { test: (n) => /fish/.test(n), url: IMG.fishCurry },

  { test: (n) => /chicken.*biryani/.test(n), url: IMG.chickenBiryani },
  { test: (n) => /veg.*biryani|vegetable.*biryani/.test(n), url: IMG.vegBiryani },
  { test: (n) => /biryani/.test(n), url: IMG.biryani },

  { test: (n) => /garlic.*naan/.test(n), url: IMG.garlicNaan },
  { test: (n) => /naan/.test(n), url: IMG.naan },
  { test: (n) => /kulcha/.test(n), url: IMG.kulcha },
  { test: (n) => /aloo.*paratha|alu.*paratha/.test(n), url: IMG.aaluParatha },
  { test: (n) => /paratha/.test(n), url: IMG.paratha },
  { test: (n) => /roti|chapati/.test(n), url: IMG.roti },

  { test: (n) => /raita/.test(n), url: IMG.raita },
  { test: (n) => /rice|basmati/.test(n), url: IMG.rice },
  { test: (n) => /fries|french fry/.test(n), url: IMG.fries },
  { test: (n) => /chutney/.test(n), url: IMG.chutney },

  { test: (n) => /gulab.*jamun/.test(n), url: IMG.gulabJamun },
  { test: (n) => /rasmalai|ras malai/.test(n), url: IMG.rasmalai },
  { test: (n) => /kheer|rice.*pudding/.test(n), url: IMG.kheer },
  { test: (n) => /kulfi|ice.*cream/.test(n), url: IMG.kulfi },

  { test: (n) => /chai|masala.*tea|\btea\b/.test(n), url: IMG.chai },
  { test: (n) => /mango.*lassi/.test(n), url: IMG.mangoLassi },
  { test: (n) => /lassi/.test(n), url: IMG.lassi },
  { test: (n) => /coffee/.test(n), url: IMG.coffee },
  { test: (n) => /juice|mango.*drink/.test(n), url: IMG.juice },
  { test: (n) => /soda|water|coke|pepsi|sprite/.test(n), url: IMG.soda },
];

export function dishImage(name: string, category: string): string {
  const n = name.toLowerCase();
  for (const m of MATCHERS) {
    if (m.test(n)) return m.url;
  }
  return CATEGORY_FALLBACK[category] ?? IMG.butterChicken;
}
