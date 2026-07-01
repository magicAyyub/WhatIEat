/**
 * store/nutrition-store.ts
 * ─────────────────────────
 * Charge les repas depuis GET /users/me/recipes/preparations?date=today
 * Reset automatique chaque jour.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userService } from "@/services/userService";

export type MealLog = {
  id:          string;
  title:       string;
  meal_type:   string;
  calories:    number;
  protein_g:   number;
  carbs_g:     number;
  fat_g:       number;
  logged_at:   string;
};

type NutritionStore = {
  date:    string;
  meals:   MealLog[];
  loading: boolean;

  totalCalories: () => number;
  totalProtein:  () => number;
  totalCarbs:    () => number;
  totalFat:      () => number;

  logMeal:    (meal: Omit<MealLog, "id" | "logged_at">) => void;
  removeMeal: (id: string) => void;
  resetDay:   () => void;
  loadFromDB: () => Promise<void>;
};

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export const useNutritionStore = create<NutritionStore>()(
  persist(
    (set, get) => ({
      date:    todayStr(),
      meals:   [],
      loading: false,

      totalCalories: () => get().meals.reduce((s, m) => s + (m.calories  || 0), 0),
      totalProtein:  () => get().meals.reduce((s, m) => s + (m.protein_g || 0), 0),
      totalCarbs:    () => get().meals.reduce((s, m) => s + (m.carbs_g   || 0), 0),
      totalFat:      () => get().meals.reduce((s, m) => s + (m.fat_g     || 0), 0),

      logMeal: (meal) => {
        const today = todayStr();
        set((s) => ({
          date:  today,
          meals: [
            ...(s.date !== today ? [] : s.meals),
            { ...meal, id: Math.random().toString(36).substring(2, 9), logged_at: new Date().toISOString() },
          ],
        }));
      },

      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),

      resetDay: () => set({ date: todayStr(), meals: [] }),

      loadFromDB: async () => {
        set({ loading: true });
        try {
          const today = todayStr();
          // Utilise la nouvelle route /preparations?date=today
          const preps = await userService.getPreparations(today);

          if (preps.length > 0) {
            const meals: MealLog[] = preps.map((p) => ({
              id:        String(p.id),
              title:     p.title,
              meal_type: p.meal_type || "meal",
              calories:  p.calories  || 0,
              protein_g: p.protein_g || 0,
              carbs_g:   p.carbs_g   || 0,
              fat_g:     p.total_fat_g || 0,
              logged_at: p.prepared_at,
            }));
            set({ date: today, meals });
          } else if (get().date !== today) {
            set({ date: today, meals: [] });
          }
        } catch (e) {
          console.warn("Chargement nutrition DB échoué:", e);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name:    "whatieat-nutrition",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.date !== todayStr()) {
          state.meals = [];
          state.date  = todayStr();
        }
      },
    },
  ),
);