import type { RecipeCardData } from "@/components/whatieat/recipe-card-large";
import type { ExpiringItem } from "@/components/whatieat/expiring-item-row";

export const RECIPE_IMAGES = {
  mediterranean:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  poke: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80",
  oats: "https://images.unsplash.com/photo-1517673400267-025144a960be?w=800&q=80",
} as const;

export const homeExpiringItems: ExpiringItem[] = [
  { name: "Avocat", quantity: "2 pièces", expiresIn: 1, emoji: "🥑" },
  { name: "Yaourt grec", quantity: "500g", expiresIn: 2, emoji: "🥛" },
  { name: "Tomates cerises", quantity: "250g", expiresIn: 0, emoji: "🍅" },
];

export const featuredHomeRecipe: RecipeCardData = {
  name: "Bowl Méditerranéen Poulet-Quinoa",
  calories: 520,
  protein: 38,
  carbs: 45,
  fat: 18,
  time: "25 min",
  matchPercent: 95,
  tags: ["Riche en protéines", "Sans gluten"],
  imageUrl: RECIPE_IMAGES.mediterranean,
};

export const lunchRecipes: RecipeCardData[] = [
  featuredHomeRecipe,
  {
    name: "Poké Bowl Saumon-Mangue",
    calories: 480,
    protein: 32,
    carbs: 52,
    fat: 14,
    time: "15 min",
    matchPercent: 88,
    tags: ["Oméga-3", "Rapide"],
    imageUrl: RECIPE_IMAGES.poke,
  },
];
