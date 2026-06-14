import type { ActivityLevel, BiologicalSex, SportsObjective } from "./profile";

/** Contrat JSON renvoyé à la fin de l'onboarding */
export type OnboardingPayloadV1 = {
  completedAt: string;
  user: {
    firstName: string;
    sex: BiologicalSex;
    sexLabel: string;
    age: number;
    weightKg: number;
    heightCm: number;
  };
  goals: {
    objective: SportsObjective;
    objectiveLabel: string;
    activityLevel: ActivityLevel;
    activityLabel: string;
  };
  restrictions: {
    allergiesAndIntolerances: string[];
  };
  nutrition: {
    /** Calories à consommer par jour */
    dailyCalorieTarget: number;
    unit: "kcal";
    /** Détail du calcul (Mifflin-St Jeor + activité + objectif) */
    calculation: {
      formula: "mifflin-st-jeor";
      sexOffset: number;
      bmr: number;
      tdee: number;
      /** Ex. −0.15 = −15 % du TDEE pour perte de poids */
      objectiveAdjustmentPercent: number;
      /** Delta kcal correspondant (tdee × pourcentage) */
      objectiveAdjustment: number;
      minCalories: number;
    };
  };
};

export type OnboardingPayload = OnboardingPayloadV1;
