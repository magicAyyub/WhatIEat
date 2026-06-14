import type { Ingredient } from "@/types/ingredient";
import { mergeScannedIngredients as mergeIngredients } from "@/utils/fridge-display";
import { create } from "zustand";

export { useProfileStore } from "./profile-store";

// ---------------------------------------------------------------------------
// Fridge store — ingredients detected from the last scan
// ---------------------------------------------------------------------------

type FridgeStore = {
  ingredients: Ingredient[];
  setIngredients: (items: Ingredient[]) => void;
  mergeScannedIngredients: (scanned: Ingredient[]) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
};

export const useFridgeStore = create<FridgeStore>((set) => ({
  ingredients: [],
  setIngredients: (items) => set({ ingredients: items }),
  mergeScannedIngredients: (scanned) =>
    set((state) => ({
      ingredients: mergeIngredients(state.ingredients, scanned),
    })),
  removeIngredient: (id) =>
    set((state) => ({
      ingredients: state.ingredients.filter((i) => i.id !== id),
    })),
  clearIngredients: () => set({ ingredients: [] }),
}));

