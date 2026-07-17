/**
 * store/liked-store.ts
 * ─────────────────────
 * Recettes likées : cache local + sync NeonDB.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userService, type LikedRecipe } from "@/services/userService";

type ApiRecipe = {
  title:               string;
  score?:              number;
  matched_ingredients?: string[];
  missing_ingredients?: string[];
  all_ingredients?:    string[];
  calorie_fit?:        string;
  nutrition?:  {
    calories?:        number;
    protein_g?:       number;
    carbs_g?:         number;
    total_fat_g?:     number;
    saturated_fat_g?: number;
    sugar_g?:         number;
    sodium_mg?:       number;
  };
  steps?:     { step: number; instruction: string }[];
  meal_type?: string;
  minutes?:   number;
};

type LikedStore = {
  likedRecipes: LikedRecipe[];
  likedTitles:  Set<string>;
  likeRecipe:   (recipe: ApiRecipe) => Promise<void>;
  unlikeRecipe: (recipeId: number, title: string) => Promise<void>;
  markCooked:   (recipeId: number) => Promise<void>;
  loadFromDB:   () => Promise<void>;
  isLiked:      (title: string) => boolean;
  clear:        () => void;
};

export const useLikedStore = create<LikedStore>()(
  persist(
    (set, get) => ({
      likedRecipes: [],
      likedTitles:  new Set<string>(),

      isLiked: (title) => get().likedTitles.has(title),

      likeRecipe: async (recipe) => {
        const temp: LikedRecipe = {
          id:                   Date.now(),
          title:                recipe.title,
          meal_type:            recipe.meal_type,
          minutes:              recipe.minutes,
          calories:             recipe.nutrition?.calories,
          protein_g:            recipe.nutrition?.protein_g,
          carbs_g:              recipe.nutrition?.carbs_g,
          total_fat_g:          recipe.nutrition?.total_fat_g,
          is_prepared:          false,
          saved_at:             new Date().toISOString(),
          all_ingredients:      recipe.all_ingredients,
          missing_ingredients:  recipe.missing_ingredients,
          matched_ingredients:  recipe.matched_ingredients,
        };
        set((s) => ({
          likedRecipes: [temp, ...s.likedRecipes],
          likedTitles:  new Set([...s.likedTitles, recipe.title]),
        }));
        try {
          const res = await userService.likeRecipe({
            title:               recipe.title,
            meal_type:           recipe.meal_type,
            minutes:             recipe.minutes,
            calories:            recipe.nutrition?.calories,
            protein_g:           recipe.nutrition?.protein_g,
            carbs_g:             recipe.nutrition?.carbs_g,
            total_fat_g:         recipe.nutrition?.total_fat_g,
            saturated_fat_g:     recipe.nutrition?.saturated_fat_g,
            sugar_g:             recipe.nutrition?.sugar_g,
            sodium_mg:           recipe.nutrition?.sodium_mg,
            steps:               recipe.steps,
            all_ingredients:     recipe.all_ingredients,
            matched_ingredients: recipe.matched_ingredients,
            missing_ingredients: recipe.missing_ingredients,
          });
          set((s) => ({
            likedRecipes: s.likedRecipes.map((r) =>
              r.title === recipe.title && r.id === temp.id ? { ...r, id: res.recipe_id } : r
            ),
          }));
        } catch (e) { console.warn("Like DB échoué:", e); }
      },

      unlikeRecipe: async (recipeId, title) => {
        set((s) => {
          const titles = new Set(s.likedTitles);
          titles.delete(title);
          return { likedRecipes: s.likedRecipes.filter((r) => r.id !== recipeId), likedTitles: titles };
        });
        try { await userService.unlikeRecipe(recipeId); }
        catch (e) { console.warn("Unlike DB échoué:", e); }
      },

      markCooked: async (recipeId) => {
        set((s) => ({
          likedRecipes: s.likedRecipes.map((r) =>
            r.id === recipeId ? { ...r, is_prepared: true, prepared_at: new Date().toISOString() } : r
          ),
        }));
        try { await userService.markRecipeCooked(recipeId); }
        catch (e) { console.warn("Mark cooked DB échoué:", e); }
      },

      loadFromDB: async () => {
        try {
          const recipes = await userService.getLikedRecipes();
          set({ likedRecipes: recipes, likedTitles: new Set(recipes.map((r) => r.title)) });
        } catch (e) { console.warn("Load liked DB échoué:", e); }
      },

      clear: () => set({ likedRecipes: [], likedTitles: new Set() }),
    }),
    {
      name:    "whatieat-liked",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ likedRecipes: s.likedRecipes, likedTitles: Array.from(s.likedTitles) }),
      merge: (persisted: any, current) => ({
        ...current, ...persisted,
        likedTitles: new Set(persisted?.likedTitles ?? []),
      }),
    },
  ),
);