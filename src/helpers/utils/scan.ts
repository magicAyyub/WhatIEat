import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Image as RNImage } from "react-native";

import type { Detection, Ingredient } from "@/types/ingredient";
import { getIconForFoodClass } from "@/helpers/utils/icons";

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
  { displayName: string; category: string }
> = {
  apple:    { displayName: "Apples",       category: "Fruits"     },
  banana:   { displayName: "Bananas",      category: "Fruits"     },
  cabbage:  { displayName: "Cabbage",      category: "Vegetables" },
  carrot:   { displayName: "Carrots",      category: "Vegetables" },
  cucumber: { displayName: "Cucumber",     category: "Vegetables" },
  date:     { displayName: "Dates",        category: "Fruits"     },
  eggplant: { displayName: "Eggplant",     category: "Vegetables" },
  eggs:     { displayName: "Eggs",         category: "Protein"    },
  garlic:   { displayName: "Garlic",       category: "Vegetables" },
  lemon:    { displayName: "Lemon",        category: "Fruits"     },
  lettuce:  { displayName: "Lettuce",      category: "Vegetables" },
  okra:     { displayName: "Okra",         category: "Vegetables" },
  onion:    { displayName: "Onion",        category: "Vegetables" },
  orange:   { displayName: "Orange",       category: "Fruits"     },
  potato:   { displayName: "Potatoes",     category: "Vegetables" },
  tomato:   { displayName: "Tomatoes",     category: "Vegetables" },
  butter:   { displayName: "Butter",       category: "Dairy"      },
  cheese:   { displayName: "Cheese",       category: "Dairy"      },
  milk:     { displayName: "Milk",         category: "Dairy"      },
  yogurt:   { displayName: "Greek yogurt", category: "Dairy"      },
  bread:    { displayName: "Bread",        category: "Other"      },
  beans:    { displayName: "Beans",        category: "Vegetables" },
  beef:     { displayName: "Beef",         category: "Protein"    },
  bulgur:   { displayName: "Bulgur",       category: "Other"      },
  chicken:  { displayName: "Chicken",      category: "Protein"    },
  chickpea: { displayName: "Chickpeas",    category: "Vegetables" },
  fish:     { displayName: "Fish",         category: "Protein"    },
  lamb:     { displayName: "Lamb",         category: "Protein"    },
  lentil:   { displayName: "Lentils",      category: "Other"      },
  rice:     { displayName: "Basmati rice", category: "Other"      },
  spinach:  { displayName: "Spinach",      category: "Vegetables" },
};

export function mapScanToIngredient(raw: {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
}): Ingredient {
  const classId = raw.id.toLowerCase();
  const meta = INGREDIENT_MAP[classId];

  const name = meta ? meta.displayName : raw.name;
  const icon = getIconForFoodClass(classId);
  const category = meta ? meta.category : "Other";

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
    expiresAt: undefined,
    icon,
    category,
  };
}
