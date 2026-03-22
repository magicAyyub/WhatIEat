import { useFridgeStore } from "@/store";

/**
 * Convenience hook for the fridge ingredient state backed by Zustand.
 * State persists across screens — use this instead of local useState.
 */
export function useFridge() {
  const { ingredients, setIngredients, removeIngredient, clearIngredients } =
    useFridgeStore();

  return {
    ingredients,
    setScannedIngredients: setIngredients,
    removeIngredient,
    clearIngredients,
  };
}
