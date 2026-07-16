/**
 * Safely resolves an icon name to a valid MaterialCommunityIcons glyph.
 * Accepts either an icon name or a food class/display name.
 * Always returns a known-valid icon — never the raw unknown string.
 */

const FALLBACK = "food-variant";

/** Food class / label → valid MaterialCommunityIcons name */
const FOOD_ICON_MAP: Record<string, string> = {
  // ── Scan classes (31) ──────────────────────────────────────────────
  apple: "food-apple",
  banana: "fruit-pear",
  cabbage: "leaf",
  carrot: "carrot",
  cucumber: "chili-mild",
  date: "fruit-grapes",
  eggplant: "food-variant",
  eggs: "egg",
  egg: "egg",
  garlic: "flower-outline",
  lemon: "fruit-citrus",
  lettuce: "leaf",
  okra: "chili-mild",
  onion: "circle-outline",
  orange: "fruit-citrus",
  potato: "french-fries",
  potatoes: "french-fries",
  tomato: "fruit-cherries",
  tomatoes: "fruit-cherries",
  butter: "food-croissant",
  cheese: "cheese",
  milk: "cup-water",
  yogurt: "cup",
  yoghurt: "cup",
  bread: "bread-slice",
  beans: "sprout",
  beef: "food-steak",
  bulgur: "barley",
  chicken: "food-drumstick",
  chickpea: "sprout",
  chickpeas: "sprout",
  fish: "fish",
  salmon: "fish",
  lamb: "food-steak",
  lentil: "grain",
  lentils: "grain",
  rice: "rice",
  spinach: "leaf",

  // ── French / legacy display names ──────────────────────────────────
  apples: "food-apple",
  bananas: "fruit-pear",
  banane: "fruit-pear",
  bananes: "fruit-pear",
  avocats: "food-variant",
  avocado: "food-variant",
  avocat: "food-variant",
  tomate: "fruit-cherries",
  tomates: "fruit-cherries",
  broccoli: "leaf",
  brocoli: "leaf",
  mango: "fruit-citrus",
  mangue: "fruit-citrus",
  blueberry: "fruit-grapes",
  blueberries: "fruit-grapes",
  myrtilles: "fruit-grapes",
  poulet: "food-drumstick",
  saumon: "fish",
  oeuf: "egg",
  oeufs: "egg",
  carotte: "carrot",
  carottes: "carrot",
  carrots: "carrot",
  yaourt: "cup",
  fromage: "cheese",
  riz: "rice",
  quinoa: "barley",
  oranges: "fruit-citrus",
  lemons: "fruit-citrus",
  onions: "circle-outline",
  cucumbers: "chili-mild",
  eggplants: "food-variant",
  dates: "fruit-grapes",
  basmati: "rice",
  cherry: "fruit-cherries",

  // ── Common pantry / fridge items (manual add, not in scan model) ───
  // Pasta & grains
  pasta: "pasta",
  pates: "pasta",
  pâtes: "pasta",
  noodles: "noodles",
  noodle: "noodles",
  spaghetti: "pasta",
  penne: "pasta",
  fusilli: "pasta",
  macaroni: "pasta",
  couscous: "grain",
  oats: "barley",
  oatmeal: "barley",
  avoine: "barley",
  flour: "grain",
  farine: "grain",
  cereal: "bowl",
  cereales: "bowl",
  céréales: "bowl",

  // Dairy & drinks
  lait: "cup-water",
  cream: "cup",
  creme: "cup",
  crème: "cup",
  "sour cream": "cup",
  kefir: "cup",
  juice: "cup-water",
  jus: "cup-water",
  water: "cup-water",
  eau: "cup-water",
  coffee: "coffee",
  cafe: "coffee",
  café: "coffee",
  tea: "tea",
  the: "tea",
  thé: "tea",
  soda: "bottle-soda",
  wine: "bottle-wine",
  vin: "bottle-wine",
  beer: "beer",
  biere: "beer",
  bière: "beer",

  // Proteins & meats
  turkey: "food-turkey",
  dinde: "food-turkey",
  pork: "pig",
  porc: "pig",
  ham: "food-steak",
  jambon: "food-steak",
  bacon: "food-steak",
  tuna: "fish",
  thon: "fish",
  shrimp: "fish",
  crevette: "fish",
  crevettes: "fish",
  tofu: "cube-outline",
  meat: "food-steak",
  viande: "food-steak",

  // Veggies & fruits
  zucchini: "chili-mild",
  courgette: "chili-mild",
  courgettes: "chili-mild",
  pepper: "chili-hot",
  peppers: "chili-hot",
  poivron: "chili-hot",
  poivrons: "chili-hot",
  chili: "chili-hot",
  mushroom: "mushroom",
  mushrooms: "mushroom",
  champignon: "mushroom",
  champignons: "mushroom",
  corn: "corn",
  mais: "corn",
  maïs: "corn",
  peas: "sprout",
  petitpois: "sprout",
  "petits pois": "sprout",
  asparagus: "leaf",
  asperge: "leaf",
  asperges: "leaf",
  celery: "leaf",
  celeri: "leaf",
  céleri: "leaf",
  pear: "fruit-pear",
  poire: "fruit-pear",
  poires: "fruit-pear",
  pineapple: "fruit-pineapple",
  ananas: "fruit-pineapple",
  watermelon: "fruit-watermelon",
  pasteque: "fruit-watermelon",
  pastèque: "fruit-watermelon",
  grape: "fruit-grapes",
  grapes: "fruit-grapes",
  raisin: "fruit-grapes",
  raisins: "fruit-grapes",
  strawberry: "fruit-cherries",
  strawberries: "fruit-cherries",
  fraise: "fruit-cherries",
  fraises: "fruit-cherries",
  peach: "fruit-citrus",
  peche: "fruit-citrus",
  pêche: "fruit-citrus",
  kiwi: "fruit-citrus",

  // Bakery & snacks
  baguette: "baguette",
  toast: "bread-slice",
  croissant: "food-croissant",
  cookie: "cookie",
  cookies: "cookie",
  biscuit: "cookie",
  biscuits: "cookie",
  cake: "cake",
  gateau: "cake",
  gâteau: "cake",
  cupcake: "cupcake",
  pizza: "pizza",
  burger: "hamburger",
  hamburger: "hamburger",
  "ice cream": "ice-cream",
  glace: "ice-cream",
  candy: "candy",
  bonbon: "candy",
  bonbons: "candy",

  // Condiments & oils
  oil: "oil",
  huile: "oil",
  olive: "fruit-citrus",
  olives: "fruit-citrus",
  salt: "shaker-outline",
  sel: "shaker-outline",
  peppercorn: "shaker",
  poivre: "shaker",
  sauce: "bottle-tonic",
  vinegar: "bottle-tonic",
  vinaigre: "bottle-tonic",
  mustard: "bottle-tonic",
  moutarde: "bottle-tonic",
  ketchup: "bottle-tonic",
  mayo: "bottle-tonic",
  mayonnaise: "bottle-tonic",
  honey: "bee",
  miel: "bee",
  sugar: "cube-outline",
  sucre: "cube-outline",
  jam: "bottle-tonic",
  confiture: "bottle-tonic",

  // Prepared / other
  soup: "bowl",
  soupe: "bowl",
  salad: "leaf",
  salade: "leaf",
  sandwich: "food-hot-dog",
  leftovers: "fridge-outline",
  reste: "fridge-outline",
  restes: "fridge-outline",

  // ── Invalid icon names previously used (must remap) ────────────────
  "glass-milk": "cup-water",
  "fruit-mango": "fruit-citrus",
  food: "french-fries", // old potato mapping was the burger glyph
};

/** Known-valid MaterialCommunityIcons used by this app */
const VALID_ICONS = new Set([
  "food-apple",
  "fruit-pear",
  "leaf",
  "carrot",
  "chili-mild",
  "chili-hot",
  "fruit-grapes",
  "food-variant",
  "egg",
  "flower-outline",
  "fruit-citrus",
  "circle-outline",
  "french-fries",
  "fruit-cherries",
  "fruit-pineapple",
  "fruit-watermelon",
  "food-croissant",
  "cheese",
  "cup-water",
  "cup",
  "bread-slice",
  "baguette",
  "sprout",
  "food-steak",
  "barley",
  "food-drumstick",
  "food-turkey",
  "fish",
  "grain",
  "rice",
  "pasta",
  "noodles",
  "peanut",
  "corn",
  "mushroom",
  "bowl",
  "seed",
  "coffee",
  "tea",
  "beer",
  "bottle-soda",
  "bottle-wine",
  "bottle-tonic",
  "oil",
  "shaker",
  "shaker-outline",
  "cookie",
  "cake",
  "cupcake",
  "candy",
  "ice-cream",
  "pizza",
  "hamburger",
  "food-hot-dog",
  "pig",
  "cube-outline",
  "bee",
  "fridge-outline",
  "pot",
  "pot-steam",
]);

function lookupFoodKey(key: string): string | null {
  const lower = key.toLowerCase().trim();
  if (!lower) return null;
  if (FOOD_ICON_MAP[lower]) return FOOD_ICON_MAP[lower];
  // strip trailing "s" for simple plurals (carrots → carrot)
  if (lower.endsWith("s") && FOOD_ICON_MAP[lower.slice(0, -1)]) {
    return FOOD_ICON_MAP[lower.slice(0, -1)];
  }
  return null;
}

export function getSafeIconName(iconName: string | undefined | null): string {
  if (!iconName) return FALLBACK;

  const lower = iconName.toLowerCase().trim();

  if (VALID_ICONS.has(lower) && lower !== FALLBACK) return lower;

  const fromMap = lookupFoodKey(lower);
  if (fromMap) return fromMap;

  if (VALID_ICONS.has(lower)) return lower;

  return FALLBACK;
}

/**
 * Resolve the best icon for a fridge item.
 * Prefer a specific stored icon; otherwise derive from the ingredient name
 * (needed because the DB does not store icons).
 */
export function resolveIngredientIcon(
  name?: string | null,
  storedIcon?: string | null,
): string {
  // Specific stored icon (not the generic fallback)
  if (storedIcon) {
    const fromIcon = getSafeIconName(storedIcon);
    if (fromIcon !== FALLBACK) return fromIcon;
  }

  if (name) {
    const lower = name.toLowerCase().trim();

    // Exact / plural match on full name
    const exact = lookupFoodKey(lower);
    if (exact) return exact;

    // Match any significant word ("cherry tomatoes" → tomato, "basmati rice" → rice)
    const words = lower.split(/[\s,_-]+/).filter((w) => w.length > 2);
    for (const word of words) {
      const hit = lookupFoodKey(word);
      if (hit) return hit;
    }
  }

  return FALLBACK;
}

/** Icon for a scan class id (e.g. "potato") — always valid. */
export function getIconForFoodClass(classId: string): string {
  return resolveIngredientIcon(classId);
}
