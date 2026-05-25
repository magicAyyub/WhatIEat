export type Ingredient = {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  expiresAt?: string; // ISO date string
};

export type { UserProfile, SportsObjective, ActivityLevel } from "./profile";

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
};
