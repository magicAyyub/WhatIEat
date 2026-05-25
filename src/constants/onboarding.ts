import type { ActivityLevel, SportsObjective } from "@/types/profile";

export const ONBOARDING_STEPS = 5;

export const ALLERGY_OPTIONS = [
  "Gluten",
  "Lactose",
  "Arachides",
  "Fruits à coque",
  "Œufs",
  "Soja",
  "Poisson",
  "Crustacés",
  "Sésame",
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
    title: "Perte de poids",
    subtitle: "Réduire la masse grasse en douceur",
  },
  {
    id: "muscle-gain",
    emoji: "💪",
    title: "Prise de muscle",
    subtitle: "Construire du muscle avec un surplus calorique",
  },
  {
    id: "maintenance",
    emoji: "⚖️",
    title: "Maintien",
    subtitle: "Garder ton poids et ton équilibre actuel",
  },
];

export const ACTIVITY_OPTIONS: {
  id: ActivityLevel;
  emoji: string;
  title: string;
}[] = [
  { id: "sedentary", emoji: "🪑", title: "Sédentaire" },
  { id: "light", emoji: "🚶", title: "Légère (1-2x/sem)" },
  { id: "moderate", emoji: "🏃", title: "Modérée (3-4x/sem)" },
  { id: "intense", emoji: "🏋️", title: "Intense (5x+/sem)" },
];

export const OBJECTIVE_LABELS: Record<SportsObjective, string> = {
  "weight-loss": "Perte de poids",
  "muscle-gain": "Prise de muscle",
  maintenance: "Maintien",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sédentaire",
  light: "Légère · 1-2x/semaine",
  moderate: "Modérée · 3-4x/semaine",
  intense: "Intense · 5x+/semaine",
};
