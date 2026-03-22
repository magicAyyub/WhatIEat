import type { Ingredient, UserProfile } from "@/types/ingredient";
import { create } from "zustand";

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

// ---------------------------------------------------------------------------
// Profile store — user dietary preferences & objectives
// ---------------------------------------------------------------------------

type ProfileStore = {
  profile: UserProfile;
  setProfile: (updates: Partial<UserProfile>) => void;
};

const defaultProfile: UserProfile = {
  dietaryRestrictions: [],
  sportsObjective: "maintenance",
  calorieTarget: 2000,
};

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: defaultProfile,
  setProfile: (updates) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),
}));
