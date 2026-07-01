import type { ActivityLevel, SportsObjective } from "@/types/profile";

export const ONBOARDING_STEPS = 5;

export const ALLERGY_OPTIONS = [
  "Gluten",
  "Lactose",
  "Peanuts",
  "Tree nuts",
  "Eggs",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
] as const;

export const GOAL_OPTIONS: {
  id: SportsObjective;
  emoji: string;
  title: string;
  subtitle: string;
}[] = [
  {
    id: "weight-loss",
    emoji: "🔥",
    title: "Weight loss",
    subtitle: "Reduce body fat gradually",
  },
  {
    id: "muscle-gain",
    emoji: "💪",
    title: "Muscle gain",
    subtitle: "Build muscle with a calorie surplus",
  },
  {
    id: "maintenance",
    emoji: "⚖️",
    title: "Maintenance",
    subtitle: "Keep your current weight and balance",
  },
];

export const ACTIVITY_OPTIONS: {
  id: ActivityLevel;
  emoji: string;
  title: string;
}[] = [
  { id: "sedentary", emoji: "🪑", title: "Sedentary" },
  { id: "light", emoji: "🚶", title: "Light (1-2x/week)" },
  { id: "moderate", emoji: "🏃", title: "Moderate (3-4x/week)" },
  { id: "intense", emoji: "🏋️", title: "Intense (5x+/week)" },
];

export const OBJECTIVE_LABELS: Record<SportsObjective, string> = {
  "weight-loss": "Weight loss",
  "muscle-gain": "Muscle gain",
  maintenance: "Maintenance",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Light · 1-2x/week",
  moderate: "Moderate · 3-4x/week",
  intense: "Intense · 5x+/week",
};
