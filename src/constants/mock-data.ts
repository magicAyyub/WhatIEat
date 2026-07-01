import type { RecipeCardData } from "@/components/whatieat/recipe-card-large";
import type { ExpiringItem } from "@/components/whatieat/expiring-item-row";

export const RECIPE_IMAGES = {
  mediterranean:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  poke: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80",
  oats: "https://images.unsplash.com/photo-1517673400267-025144a960be?w=800&q=80",
} as const;

export const homeExpiringItems: ExpiringItem[] = [
  { name: "Avocado", quantity: "2 pieces", expiresIn: 1, icon: "food-variant" },
  { name: "Greek yogurt", quantity: "500g", expiresIn: 2, icon: "cup" },
  { name: "Cherry tomatoes", quantity: "250g", expiresIn: 0, icon: "fruit-cherries" },
];

export const featuredHomeRecipe: RecipeCardData = {
  name: "Mediterranean Chicken-Quinoa Bowl",
  calories: 520,
  protein: 38,
  carbs: 45,
  fat: 18,
  time: "25 min",
  matchPercent: 95,
  tags: ["High protein", "Gluten-free"],
  imageUrl: RECIPE_IMAGES.mediterranean,
};

export const lunchRecipes: RecipeCardData[] = [
  featuredHomeRecipe,
  {
    name: "Salmon-Mango Poke Bowl",
    calories: 480,
    protein: 32,
    carbs: 52,
    fat: 14,
    time: "15 min",
    matchPercent: 88,
    tags: ["Omega-3", "Quick"],
    imageUrl: RECIPE_IMAGES.poke,
  },
];
