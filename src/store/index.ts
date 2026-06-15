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
  { id: "poulet",    name: "chicken",         quantity: "500g",     expiresAt: getExpiryDate(4),  icon: "food-drumstick", category: "Protéines" },
{ id: "saumon",    name: "fresh salmon",    quantity: "200g",     expiresAt: getExpiryDate(1),  icon: "fish",           category: "Protéines" },
{ id: "oeuf",     name: "egg",             quantity: "6 pieces", expiresAt: getExpiryDate(8),  icon: "egg",            category: "Protéines" },
{ id: "avocat",    name: "avocado",         quantity: "2 pieces", expiresAt: getExpiryDate(1),  icon: "food-variant",   category: "Légumes"   },
{ id: "tomate",    name: "cherry tomatoes", quantity: "250g",     expiresAt: getExpiryDate(0),  icon: "fruit-cherries", category: "Légumes"   },
{ id: "brocoli",   name: "broccoli",        quantity: "1 head",   expiresAt: getExpiryDate(3),  icon: "leaf",           category: "Légumes"   },
{ id: "carotte",   name: "carrot",          quantity: "500g",     expiresAt: getExpiryDate(10), icon: "carrot",         category: "Légumes"   },
{ id: "yaourt",    name: "greek yogurt",    quantity: "500g",     expiresAt: getExpiryDate(2),  icon: "cup",            category: "Laitier"   },
{ id: "fromage",   name: "shredded cheese", quantity: "150g",     expiresAt: getExpiryDate(15), icon: "cheese",         category: "Laitier"   },
{ id: "riz",       name: "basmati rice",    quantity: "1kg",      expiresAt: getExpiryDate(90), icon: "rice",           category: "Céréales"  },
{ id: "quinoa",    name: "quinoa",          quantity: "500g",     expiresAt: getExpiryDate(60), icon: "barley",         category: "Céréales"  },
{ id: "bananes",   name: "banana",          quantity: "3 pieces", expiresAt: getExpiryDate(3),  icon: "food-variant",   category: "Fruits"    },
{ id: "myrtilles", name: "blueberry",       quantity: "125g",     expiresAt: getExpiryDate(2),  icon: "fruit-grapes",   category: "Fruits"    },
{ id: "mangue",    name: "mango",           quantity: "1 piece",  expiresAt: getExpiryDate(2),  icon: "fruit-citrus",   category: "Fruits"    },
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
