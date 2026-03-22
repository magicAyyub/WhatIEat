import type { Recipe, UserProfile } from "@/types/ingredient";
import { api } from "./api";

type RecipeRecommendationParams = {
  ingredientIds: string[];
  profile?: Partial<UserProfile>;
};

/**
 * Fetches recipe recommendations based on detected ingredients and user profile.
 */
export async function getRecipes(
  params: RecipeRecommendationParams,
): Promise<Recipe[]> {
  return api.post<Recipe[]>("/recipes/recommend", params);
}

/**
 * Fetches a single recipe by ID.
 */
export async function getRecipeById(id: string): Promise<Recipe> {
  return api.get<Recipe>(`/recipes/${id}`);
}
