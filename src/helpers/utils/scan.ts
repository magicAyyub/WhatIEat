import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Image as RNImage } from "react-native";

import type { Detection, Ingredient } from "@/types/ingredient";

export const MODEL_IMAGE_SIZE = 512;
export const PREVIEW_SIZE = 340;

export async function cropToInferenceSquare(imageUri: string): Promise<string> {
  const { width, height } = await new Promise<{
    width: number;
    height: number;
  }>((resolve, reject) => {
    RNImage.getSize(
      imageUri,
      (w, h) => resolve({ width: w, height: h }),
      (err) => reject(err),
    );
  });

  const side = Math.min(width, height);
  const originX = Math.floor((width - side) / 2);
  const originY = Math.floor((height - side) / 2);

  const out = await manipulateAsync(
    imageUri,
    [{ crop: { originX, originY, width: side, height: side } }],
    { compress: 0.92, format: SaveFormat.JPEG },
  );

  return out.uri;
}

export function scaleBox(d: Detection) {
  const scale = PREVIEW_SIZE / MODEL_IMAGE_SIZE;
  const left = Math.max(0, Math.min(PREVIEW_SIZE, d.box.x1 * scale));
  const top = Math.max(0, Math.min(PREVIEW_SIZE, d.box.y1 * scale));
  const right = Math.max(0, Math.min(PREVIEW_SIZE, d.box.x2 * scale));
  const bottom = Math.max(0, Math.min(PREVIEW_SIZE, d.box.y2 * scale));
  return {
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

export function scalePolygon(points: [number, number][]) {
  const scale = PREVIEW_SIZE / MODEL_IMAGE_SIZE;
  return points
    .map(([x, y]) => {
      const sx = Math.max(0, Math.min(PREVIEW_SIZE, x * scale));
      const sy = Math.max(0, Math.min(PREVIEW_SIZE, y * scale));
      return `${sx},${sy}`;
    })
    .join(" ");
}

export const INGREDIENT_MAP: Record<
  string,
  { displayName: string; icon: string; category: string; defaultExpiryDays: number }
> = {
  apple: { displayName: "Apples", icon: "food-apple", category: "Fruits", defaultExpiryDays: 7 },
  banana: { displayName: "Bananas", icon: "food-variant", category: "Fruits", defaultExpiryDays: 3 },
  cabbage: { displayName: "Cabbage", icon: "leaf", category: "Vegetables", defaultExpiryDays: 7 },
  carrot: { displayName: "Carrots", icon: "carrot", category: "Vegetables", defaultExpiryDays: 10 },
  cucumber: { displayName: "Cucumber", icon: "food-variant", category: "Vegetables", defaultExpiryDays: 5 },
  date: { displayName: "Dates", icon: "food-variant", category: "Fruits", defaultExpiryDays: 30 },
  eggplant: { displayName: "Eggplant", icon: "food-variant", category: "Vegetables", defaultExpiryDays: 5 },
  eggs: { displayName: "Eggs", icon: "egg", category: "Protein", defaultExpiryDays: 14 },
  garlic: { displayName: "Garlic", icon: "garlic", category: "Vegetables", defaultExpiryDays: 30 },
  lemon: { displayName: "Lemon", icon: "fruit-citrus", category: "Fruits", defaultExpiryDays: 14 },
  lettuce: { displayName: "Lettuce", icon: "leaf", category: "Vegetables", defaultExpiryDays: 4 },
  okra: { displayName: "Okra", icon: "food-variant", category: "Vegetables", defaultExpiryDays: 5 },
  onion: { displayName: "Onion", icon: "onion", category: "Vegetables", defaultExpiryDays: 30 },
  orange: { displayName: "Orange", icon: "fruit-citrus", category: "Fruits", defaultExpiryDays: 10 },
  potato: { displayName: "Potatoes", icon: "potato", category: "Vegetables", defaultExpiryDays: 30 },
  tomato: { displayName: "Tomatoes", icon: "fruit-cherries", category: "Vegetables", defaultExpiryDays: 4 },
  butter: { displayName: "Butter", icon: "butter", category: "Dairy", defaultExpiryDays: 21 },
  cheese: { displayName: "Cheese", icon: "cheese", category: "Dairy", defaultExpiryDays: 14 },
  milk: { displayName: "Milk", icon: "glass-milk", category: "Dairy", defaultExpiryDays: 7 },
  yogurt: { displayName: "Greek yogurt", icon: "cup", category: "Dairy", defaultExpiryDays: 10 },
  bread: { displayName: "Bread", icon: "bread-slice", category: "Grains", defaultExpiryDays: 3 },
  beans: { displayName: "Beans", icon: "sprout", category: "Vegetables", defaultExpiryDays: 5 },
  beef: { displayName: "Beef", icon: "food-steak", category: "Protein", defaultExpiryDays: 3 },
  bulgur: { displayName: "Bulgur", icon: "barley", category: "Grains", defaultExpiryDays: 90 },
  chicken: { displayName: "Chicken", icon: "food-drumstick", category: "Protein", defaultExpiryDays: 3 },
  chickpea: { displayName: "Chickpeas", icon: "sprout", category: "Vegetables", defaultExpiryDays: 5 },
  fish: { displayName: "Fish", icon: "fish", category: "Protein", defaultExpiryDays: 2 },
  lamb: { displayName: "Lamb", icon: "food-steak", category: "Protein", defaultExpiryDays: 3 },
  lentil: { displayName: "Lentils", icon: "barley", category: "Grains", defaultExpiryDays: 90 },
  rice: { displayName: "Basmati rice", icon: "rice", category: "Grains", defaultExpiryDays: 90 },
  spinach: { displayName: "Spinach", icon: "leaf", category: "Vegetables", defaultExpiryDays: 3 },
};

export function getExpiryDateString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function mapScanToIngredient(raw: {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
}): Ingredient {
  const meta = INGREDIENT_MAP[raw.id.toLowerCase()];
  
  const name = meta ? meta.displayName : raw.name;
  const icon = meta ? meta.icon : "food-variant";
  const category = meta ? meta.category : "Other";
  const defaultExpiryDays = meta ? meta.defaultExpiryDays : 7;
  const expiresAt = getExpiryDateString(defaultExpiryDays);

  // Format quantity
  let displayQuantity = raw.quantity || "1";
  if (raw.unit === "count" || raw.unit === "pack") {
    const count = parseInt(displayQuantity, 10);
    if (!isNaN(count)) {
      displayQuantity = `${count} piece${count > 1 ? "s" : ""}`;
    }
  } else if (raw.unit === "level") {
    if (displayQuantity === "low") displayQuantity = "Low";
    else if (displayQuantity === "medium") displayQuantity = "Medium";
    else if (displayQuantity === "high") displayQuantity = "High";
  }

  return {
    id: raw.id + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    name,
    quantity: displayQuantity,
    unit: raw.unit,
    expiresAt,
    icon,
    category,
  };
}
