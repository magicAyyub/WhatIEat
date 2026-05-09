export type Ingredient = {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  expiresAt?: string; // ISO date string
};

export type UserProfile = {
  dietaryRestrictions: string[]; // e.g. ["gluten-free", "vegan"]
  sportsObjective?: "weight-loss" | "muscle-gain" | "maintenance";
  calorieTarget?: number;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ingredients: Ingredient[];
  calories: number;
  prepTimeMinutes: number;
  tags: string[];
};

export type ScanResult = {
  ingredients: Ingredient[];
  confidence: number; // 0-1
  detections?: Detection[];
};

export type Detection = {
  name: string;
  score: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
};
