import type { Ingredient } from "@/types/ingredient";

export type FridgeListItem = {
  id: string;
  name: string;
  quantity: string;
  emoji: string;
  category: string;
  expiresIn?: number;
};

const EMOJI_BY_KEYWORD: [string, string][] = [
  ["chicken", "🍗"],
  ["poulet", "🍗"],
  ["salmon", "🐟"],
  ["saumon", "🐟"],
  ["fish", "🐟"],
  ["egg", "🥚"],
  ["oeuf", "🥚"],
  ["avocado", "🥑"],
  ["avocat", "🥑"],
  ["tomato", "🍅"],
  ["tomate", "🍅"],
  ["broccoli", "🥦"],
  ["brocoli", "🥦"],
  ["carrot", "🥕"],
  ["carotte", "🥕"],
  ["yogurt", "🥛"],
  ["yaourt", "🥛"],
  ["milk", "🥛"],
  ["lait", "🥛"],
  ["cheese", "🧀"],
  ["fromage", "🧀"],
  ["rice", "🍚"],
  ["riz", "🍚"],
  ["quinoa", "🌾"],
  ["banana", "🍌"],
  ["banane", "🍌"],
  ["berry", "🫐"],
  ["myrtille", "🫐"],
  ["mango", "🥭"],
  ["mangue", "🥭"],
  ["apple", "🍎"],
  ["pomme", "🍎"],
  ["bread", "🍞"],
  ["pain", "🍞"],
  ["garlic", "🧄"],
  ["ail", "🧄"],
  ["onion", "🧅"],
  ["oignon", "🧅"],
  ["pepper", "🫑"],
  ["poivron", "🫑"],
  ["cucumber", "🥒"],
  ["concombre", "🥒"],
  ["lettuce", "🥬"],
  ["salade", "🥬"],
  ["beef", "🥩"],
  ["boeuf", "🥩"],
  ["viande", "🥩"],
];

const CATEGORY_RULES: [string, string][] = [
  ["chicken", "Protéines"],
  ["poulet", "Protéines"],
  ["salmon", "Protéines"],
  ["saumon", "Protéines"],
  ["fish", "Protéines"],
  ["egg", "Protéines"],
  ["oeuf", "Protéines"],
  ["beef", "Protéines"],
  ["meat", "Protéines"],
  ["viande", "Protéines"],
  ["milk", "Laitier"],
  ["lait", "Laitier"],
  ["yogurt", "Laitier"],
  ["yaourt", "Laitier"],
  ["cheese", "Laitier"],
  ["fromage", "Laitier"],
  ["rice", "Céréales"],
  ["riz", "Céréales"],
  ["quinoa", "Céréales"],
  ["bread", "Céréales"],
  ["pain", "Céréales"],
  ["banana", "Fruits"],
  ["banane", "Fruits"],
  ["berry", "Fruits"],
  ["apple", "Fruits"],
  ["mango", "Fruits"],
  ["tomato", "Légumes"],
  ["tomate", "Légumes"],
  ["carrot", "Légumes"],
  ["broccoli", "Légumes"],
  ["avocado", "Légumes"],
  ["lettuce", "Légumes"],
  ["onion", "Légumes"],
  ["garlic", "Légumes"],
];

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[_-]/g, " ");
}

function matchRule<T>(name: string, rules: [string, T][], fallback: T): T {
  const key = normalizeKey(name);
  for (const [token, value] of rules) {
    if (key.includes(token)) return value;
  }
  return fallback;
}

export function formatIngredientName(raw: string): string {
  const spaced = raw.replace(/[_-]/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function ingredientToListItem(ingredient: Ingredient): FridgeListItem {
  const name = formatIngredientName(ingredient.name);
  const quantity = ingredient.quantity
    ? `${ingredient.quantity} pièce${Number(ingredient.quantity) > 1 ? "s" : ""}`
    : "1 pièce";

  return {
    id: ingredient.id,
    name,
    quantity,
    emoji: matchRule(name, EMOJI_BY_KEYWORD, "🥫"),
    category: matchRule(name, CATEGORY_RULES, "Autre"),
  };
}

export function ingredientsToListItems(ingredients: Ingredient[]): FridgeListItem[] {
  return ingredients.map(ingredientToListItem);
}

export function mergeScannedIngredients(
  existing: Ingredient[],
  scanned: Ingredient[],
): Ingredient[] {
  const byKey = new Map(
    existing.map((item) => [normalizeKey(item.id || item.name), item]),
  );

  for (const item of scanned) {
    const key = normalizeKey(item.id || item.name);
    const prev = byKey.get(key);
    byKey.set(key, {
      id: item.id || key,
      name: item.name,
      quantity: item.quantity ?? prev?.quantity,
      unit: item.unit ?? prev?.unit,
      expiresAt: item.expiresAt ?? prev?.expiresAt,
    });
  }

  return Array.from(byKey.values());
}
