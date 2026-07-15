/**
 * services/userService.ts
 */

import { api, authStorage } from "./api";
import type { UserProfile } from "@/types/profile";
import type { Ingredient } from "@/types/ingredient";

// ── Types ──────────────────────────────────────────────────────────────────

export type AuthResponse = {
  token:      string;
  user_id:    number;
  first_name?: string;
};

export type LikedRecipe = {
  id:                   number;
  title:                string;
  meal_type?:           string;
  minutes?:             number;
  calories?:            number;
  protein_g?:           number;
  carbs_g?:             number;
  total_fat_g?:         number;
  is_prepared:          boolean;
  saved_at:             string;
  prepared_at?:         string;
  prep_count?:          number;
  all_ingredients?:     string[];
  missing_ingredients?: string[];
  matched_ingredients?: string[];
};

export type Preparation = {
  id:          number;
  prepared_at: string;
  recipe_id:   number;
  title:       string;
  meal_type?:  string;
  calories?:   number;
  protein_g?:  number;
  carbs_g?:    number;
  total_fat_g?:number;
};

export type FridgeItemDB = {
  id:              number;
  ingredient_name: string;
  quantity:        number;
  unit?:           string;
  expires_at?:     string;
  category?:       string;
  updated_at:      string;
};

export type SubstituteResult = {
  original:    string;
  substitutes: string[];
  notes:       string;
};

export type FeedbackResponse = {
  message:     string;
  substitutes: SubstituteResult[];
};

// ── Auth ───────────────────────────────────────────────────────────────────

export const userService = {

  async register(email: string, password: string, firstName?: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/register", { email, password, first_name: firstName }, false);
    await authStorage.saveToken(res.token, res.user_id);
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/login", { email, password }, false);
    await authStorage.saveToken(res.token, res.user_id);
    return res;
  },

  async logout() { await authStorage.clear(); },

  // ── Profil ─────────────────────────────────────────────────────────────

  async getProfile(): Promise<any> { return api.get("/users/me"); },

  async updateProfile(profile: Partial<UserProfile>): Promise<void> {
    await api.put("/users/me", {
      first_name:               profile.firstName,
      age:                      profile.age,
      weight_kg:                profile.weightKg,
      height_cm:                profile.heightCm,
      sports_objective:         profile.sportsObjective,
      activity_level:           profile.activityLevel,
      calorie_target:           profile.calorieTarget,
      has_completed_onboarding: profile.hasCompletedOnboarding,
      dietary_restrictions:     profile.dietaryRestrictions,
    });
  },

  async syncProfileToDB(profile: UserProfile): Promise<void> {
    try { await userService.updateProfile(profile); }
    catch (e) { console.warn("Sync profil DB échoué:", e); }
  },

  // ── Frigo ───────────────────────────────────────────────────────────────

  async getFridge(category?: string, search?: string): Promise<FridgeItemDB[]> {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search)   params.set("search", search);
    const qs = params.toString();
    return api.get<FridgeItemDB[]>(`/users/me/fridge${qs ? `?${qs}` : ""}`);
  },

  async getFridgeCategories(): Promise<string[]> {
    return api.get<string[]>("/users/me/fridge/categories");
  },

  async addFridgeItem(item: {
    ingredient_name: string;
    quantity:        number;
    unit?:           string;
    expires_at?:     string;
    category?:       string;
  }): Promise<{ id: number }> {
    return api.post("/users/me/fridge", item);
  },

  async syncFridgeToDB(ingredients: Ingredient[]): Promise<void> {
    try {
      const items = ingredients.map((ing) => ({
        ingredient_name: ing.name,
        quantity:        parseFloat(ing.quantity ?? "1") || 1,
        unit:            (ing.quantity ?? "").replace(/^[0-9.]+\s*/, "").trim() || "pieces",
        expires_at:      ing.expiresAt ?? null,
        category:        ing.category ?? null,
      }));
      await api.post("/users/me/fridge/bulk", items);
    } catch (e) { console.warn("Sync frigo DB échoué:", e); }
  },

  async updateFridgeItem(itemId: number, updates: {
    quantity?:   number;
    unit?:       string;
    expires_at?: string;
    category?:   string;
  }): Promise<void> {
    await api.put(`/users/me/fridge/${itemId}`, updates);
  },

  async deleteFridgeItem(itemId: number): Promise<void> {
    await api.delete(`/users/me/fridge/${itemId}`);
  },

  async clearFridge(): Promise<void> { await api.delete("/users/me/fridge"); },

  // ── Recettes likées ─────────────────────────────────────────────────────

  async getLikedRecipes(prepared?: boolean): Promise<LikedRecipe[]> {
    const query = prepared !== undefined ? `?prepared=${prepared}` : "";
    return api.get<LikedRecipe[]>(`/users/me/recipes${query}`);
  },

  async likeRecipe(recipe: {
    title:               string;
    meal_type?:          string;
    minutes?:            number;
    calories?:           number;
    protein_g?:          number;
    carbs_g?:            number;
    total_fat_g?:        number;
    saturated_fat_g?:    number;
    sugar_g?:            number;
    sodium_mg?:          number;
    steps?:              { step: number; instruction: string }[];
    all_ingredients?:    string[];
    matched_ingredients?: string[];
    missing_ingredients?: string[];
  }): Promise<{ recipe_id: number; message: string }> {
    return api.post("/users/me/recipes", recipe);
  },

  async unlikeRecipe(recipeId: number): Promise<void> {
    await api.delete(`/users/me/recipes/${recipeId}`);
  },

  async markRecipeCooked(
    recipeId:            number,
    matched_ingredients: string[] = [],
  ): Promise<{ message: string; deducted: string[] }> {
    return api.post(`/users/me/recipes/${recipeId}/prepared`, { matched_ingredients });
  },

  async unmarkRecipeCooked(recipeId: number): Promise<void> {
    await api.delete(`/users/me/recipes/${recipeId}/prepared`);
  },

  // GET /users/me/recipes/preparations?date=YYYY-MM-DD
  async getPreparations(date?: string): Promise<Preparation[]> {
    const qs = date ? `?date=${date}` : "";
    return api.get<Preparation[]>(`/users/me/recipes/preparations${qs}`);
  },

  async getRecipeDetail(recipeId: number): Promise<LikedRecipe & { steps: any[] }> {
    return api.get(`/users/me/recipes/${recipeId}`);
  },

  // ── Feedback + substituts ───────────────────────────────────────────────

  async sendFeedback(payload: {
    session_id:          string;
    recipe_title:        string;
    liked:               boolean | null;
    missing_ingredients: string[];
    cooked:              boolean;
  }): Promise<FeedbackResponse> {
    return api.post<FeedbackResponse>("/feedback", payload, false);
  },

  async getSubstitute(ingredient: string, dietary_restrictions: string[] = []): Promise<SubstituteResult> {
    return api.post<SubstituteResult>("/substitute", { ingredient, dietary_restrictions }, false);
  },
};