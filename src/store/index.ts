import type { Ingredient } from "@/types/ingredient";
import { create } from "zustand";

export { useProfileStore } from "./profile-store";

// ---------------------------------------------------------------------------
// Fridge store — ingredients detected from the last scan
// ---------------------------------------------------------------------------

type FridgeStore = {
  ingredients: Ingredient[];
  setIngredients: (items: Ingredient[]) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
};

export const useFridgeStore = create<FridgeStore>((set) => ({
  ingredients: [],
  setIngredients: (items) => set({ ingredients: items }),
  removeIngredient: (id) =>
    set((state) => ({
      ingredients: state.ingredients.filter((i) => i.id !== id),
    })),
  clearIngredients: () => set({ ingredients: [] }),
}));

