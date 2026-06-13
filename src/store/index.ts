import type { Ingredient } from "@/types/ingredient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export { useProfileStore } from "./profile-store";

// Helper to calculate expiration date string (YYYY-MM-DD)
const getExpiryDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const initialIngredients: Ingredient[] = [
  { id: "poulet", name: "Poulet", quantity: "500g", expiresAt: getExpiryDate(4), emoji: "🍗", category: "Protéines" },
  { id: "saumon", name: "Saumon frais", quantity: "200g", expiresAt: getExpiryDate(1), emoji: "🐟", category: "Protéines" },
  { id: "oeufs", name: "Œufs", quantity: "6 pièces", expiresAt: getExpiryDate(8), emoji: "🥚", category: "Protéines" },
  { id: "avocat", name: "Avocat", quantity: "2 pièces", expiresAt: getExpiryDate(1), emoji: "🥑", category: "Légumes" },
  { id: "tomate", name: "Tomates cerises", quantity: "250g", expiresAt: getExpiryDate(0), emoji: "🍅", category: "Légumes" },
  { id: "brocoli", name: "Brocoli", quantity: "1 tête", expiresAt: getExpiryDate(3), emoji: "🥦", category: "Légumes" },
  { id: "carotte", name: "Carottes", quantity: "500g", expiresAt: getExpiryDate(10), emoji: "🥕", category: "Légumes" },
  { id: "yaourt", name: "Yaourt grec", quantity: "500g", expiresAt: getExpiryDate(2), emoji: "🥛", category: "Laitier" },
  { id: "fromage", name: "Fromage râpé", quantity: "150g", expiresAt: getExpiryDate(15), emoji: "🧀", category: "Laitier" },
  { id: "riz", name: "Riz basmati", quantity: "1kg", expiresAt: getExpiryDate(90), emoji: "🍚", category: "Céréales" },
  { id: "quinoa", name: "Quinoa", quantity: "500g", expiresAt: getExpiryDate(60), emoji: "🌾", category: "Céréales" },
  { id: "bananes", name: "Bananes", quantity: "3 pièces", expiresAt: getExpiryDate(3), emoji: "🍌", category: "Fruits" },
  { id: "myrtilles", name: "Myrtilles", quantity: "125g", expiresAt: getExpiryDate(2), emoji: "🫐", category: "Fruits" },
  { id: "mangue", name: "Mangue", quantity: "1 pièce", expiresAt: getExpiryDate(2), emoji: "🥭", category: "Fruits" },
];

type FridgeStore = {
  ingredients: Ingredient[];
  setIngredients: (items: Ingredient[]) => void;
  addIngredients: (newItems: Ingredient[]) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
};

export const useFridgeStore = create<FridgeStore>()(
  persist(
    (set) => ({
      ingredients: initialIngredients,
      setIngredients: (items) => set({ ingredients: items }),
      addIngredients: (newItems) =>
        set((state) => {
          const updated = [...state.ingredients];
          for (const item of newItems) {
            // Find if an item with the same name exists (case-insensitive)
            const existingIdx = updated.findIndex(
              (i) => i.name.toLowerCase() === item.name.toLowerCase()
            );

            if (existingIdx !== -1) {
              const existing = updated[existingIdx];
              const existingNum = parseFloat(existing.quantity || "");
              const newNum = parseFloat(item.quantity || "");

              if (!isNaN(existingNum) && !isNaN(newNum)) {
                // Keep the text suffix (e.g. "pieces", "g")
                const suffix = (existing.quantity || "").replace(/^[0-9.]+\s*/, "");
                updated[existingIdx] = {
                  ...existing,
                  quantity: `${existingNum + newNum}${suffix ? " " + suffix : ""}`,
                  // Keep the soonest expiration date
                  expiresAt:
                    existing.expiresAt && item.expiresAt
                      ? existing.expiresAt < item.expiresAt
                        ? existing.expiresAt
                        : item.expiresAt
                      : existing.expiresAt || item.expiresAt,
                };
              } else {
                // Suffixes don't match or not numbers, just replace quantity and keep soonest expiration
                updated[existingIdx] = {
                  ...existing,
                  quantity: item.quantity || existing.quantity,
                  expiresAt:
                    existing.expiresAt && item.expiresAt
                      ? existing.expiresAt < item.expiresAt
                        ? existing.expiresAt
                        : item.expiresAt
                      : existing.expiresAt || item.expiresAt,
                };
              }
            } else {
              updated.push(item);
            }
          }
          return { ingredients: updated };
        }),
      removeIngredient: (id) =>
        set((state) => ({
          ingredients: state.ingredients.filter((i) => i.id !== id),
        })),
      clearIngredients: () => set({ ingredients: [] }),
    }),
    {
      name: "whatieat-fridge",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
