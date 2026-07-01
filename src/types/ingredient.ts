export type Ingredient = {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  expiresAt?: string; // ISO date string
  icon?: string;
  category?: string;
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
  mask?: {
    polygon: [number, number][];
    area: number;
    source?: string;
  };
};
