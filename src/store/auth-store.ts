/**
 * store/auth-store.ts
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userService } from "@/services/userService";
import { useProfileStore } from "./profile-store";
import { useFridgeStore } from "./index";
import { useNutritionStore } from "./nutrition-store";
import { resolveIngredientIcon } from "@/helpers/utils/icons";

type AuthStore = {
  token:            string | null;
  userId:           number | null;
  isAuthenticated:  boolean;
  hydrated:         boolean;
  setAuth:          (token: string, userId: number) => void;
  logout:           () => Promise<void>;
  loadFridgeFromDB: () => Promise<void>;
  setHydrated:      (v: boolean) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token:           null,
      userId:          null,
      isAuthenticated: false,
      hydrated:        false,

      setAuth: (token, userId) => set({ token, userId, isAuthenticated: true }),

      loadFridgeFromDB: async () => {
        try {
          const dbItems = await userService.getFridge();
          if (dbItems.length > 0) {
            const ingredients = dbItems.map((item) => ({
              id:        String(item.id),
              name:      item.ingredient_name,
              quantity:  item.unit
                ? `${item.quantity} ${item.unit}`
                : String(item.quantity),
              expiresAt: item.expires_at ?? undefined,
              icon:      resolveIngredientIcon(item.ingredient_name),
              category:  item.category ?? "Other",
            }));
            useFridgeStore.getState().setIngredients(ingredients);
          } else {
            // Utilisateur sans frigo en DB → vide le store
            useFridgeStore.getState().clearIngredients();
          }
        } catch (e) {
          console.warn("Chargement frigo DB échoué:", e);
        }
      },

      logout: async () => {
        // ── Vide TOUS les stores avant de déconnecter ──────────────
        // Obligatoire sinon le prochain utilisateur voit les données du précédent
        useFridgeStore.getState().clearIngredients();
        useNutritionStore.getState().resetDay();
        useProfileStore.getState().resetOnboarding();

        // Vide aussi AsyncStorage pour les stores persistés
        await AsyncStorage.multiRemove([
          "whatieat-fridge",
          "whatieat-nutrition",
          "whatieat-liked",
          "whatieat-profile",
        ]);

        await userService.logout();
        set({ token: null, userId: null, isAuthenticated: false });
      },

      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name:    "whatieat-auth",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => { state?.setHydrated(true); },
    },
  ),
);