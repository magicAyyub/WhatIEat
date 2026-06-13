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
  { nameFr: string; emoji: string; category: string; defaultExpiryDays: number }
> = {
  apple: { nameFr: "Pommes", emoji: "🍎", category: "Fruits", defaultExpiryDays: 7 },
  banana: { nameFr: "Bananes", emoji: "🍌", category: "Fruits", defaultExpiryDays: 3 },
  cabbage: { nameFr: "Chou", emoji: "🥬", category: "Légumes", defaultExpiryDays: 7 },
  carrot: { nameFr: "Carottes", emoji: "🥕", category: "Légumes", defaultExpiryDays: 10 },
  cucumber: { nameFr: "Concombre", emoji: "🥒", category: "Légumes", defaultExpiryDays: 5 },
  date: { nameFr: "Dattes", emoji: "🌴", category: "Fruits", defaultExpiryDays: 30 },
  eggplant: { nameFr: "Aubergine", emoji: "🍆", category: "Légumes", defaultExpiryDays: 5 },
  eggs: { nameFr: "Œufs", emoji: "🥚", category: "Protéines", defaultExpiryDays: 14 },
  garlic: { nameFr: "Ail", emoji: "🧄", category: "Légumes", defaultExpiryDays: 30 },
  lemon: { nameFr: "Citron", emoji: "🍋", category: "Fruits", defaultExpiryDays: 14 },
  lettuce: { nameFr: "Salade", emoji: "🥬", category: "Légumes", defaultExpiryDays: 4 },
  okra: { nameFr: "Gombo", emoji: "🥒", category: "Légumes", defaultExpiryDays: 5 },
  onion: { nameFr: "Oignon", emoji: "🧅", category: "Légumes", defaultExpiryDays: 30 },
  orange: { nameFr: "Orange", emoji: "🍊", category: "Fruits", defaultExpiryDays: 10 },
  potato: { nameFr: "Pommes de terre", emoji: "🥔", category: "Légumes", defaultExpiryDays: 30 },
  tomato: { nameFr: "Tomates", emoji: "🍅", category: "Légumes", defaultExpiryDays: 4 },
  butter: { nameFr: "Beurre", emoji: "🧈", category: "Laitier", defaultExpiryDays: 21 },
  cheese: { nameFr: "Fromage", emoji: "🧀", category: "Laitier", defaultExpiryDays: 14 },
  milk: { nameFr: "Lait", emoji: "🥛", category: "Laitier", defaultExpiryDays: 7 },
  yogurt: { nameFr: "Yaourt grec", emoji: "🥛", category: "Laitier", defaultExpiryDays: 10 },
  bread: { nameFr: "Pain", emoji: "🍞", category: "Céréales", defaultExpiryDays: 3 },
  beans: { nameFr: "Haricots", emoji: "🫘", category: "Légumes", defaultExpiryDays: 5 },
  beef: { nameFr: "Bœuf", emoji: "🥩", category: "Protéines", defaultExpiryDays: 3 },
  bulgur: { nameFr: "Boulghour", emoji: "🌾", category: "Céréales", defaultExpiryDays: 90 },
  chicken: { nameFr: "Poulet", emoji: "🍗", category: "Protéines", defaultExpiryDays: 3 },
  chickpea: { nameFr: "Pois chiches", emoji: "🫘", category: "Légumes", defaultExpiryDays: 5 },
  fish: { nameFr: "Poisson", emoji: "🐟", category: "Protéines", defaultExpiryDays: 2 },
  lamb: { nameFr: "Agneau", emoji: "🥩", category: "Protéines", defaultExpiryDays: 3 },
  lentil: { nameFr: "Lentilles", emoji: "🫘", category: "Céréales", defaultExpiryDays: 90 },
  rice: { nameFr: "Riz basmati", emoji: "🍚", category: "Céréales", defaultExpiryDays: 90 },
  spinach: { nameFr: "Épinards", emoji: "🥬", category: "Légumes", defaultExpiryDays: 3 },
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
  
  const name = meta ? meta.nameFr : raw.name;
  const emoji = meta ? meta.emoji : "❓";
  const category = meta ? meta.category : "Autre";
  const defaultExpiryDays = meta ? meta.defaultExpiryDays : 7;
  const expiresAt = getExpiryDateString(defaultExpiryDays);

  // Format quantity
  let displayQuantity = raw.quantity || "1";
  if (raw.unit === "count" || raw.unit === "pack") {
    const count = parseInt(displayQuantity, 10);
    if (!isNaN(count)) {
      displayQuantity = `${count} pièce${count > 1 ? "s" : ""}`;
    }
  } else if (raw.unit === "level") {
    if (displayQuantity === "low") displayQuantity = "Faible";
    else if (displayQuantity === "medium") displayQuantity = "Moyen";
    else if (displayQuantity === "high") displayQuantity = "Élevé";
  }

  return {
    id: raw.id + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    name,
    quantity: displayQuantity,
    unit: raw.unit,
    expiresAt,
    emoji,
    category,
  };
}
