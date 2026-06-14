import type { ActivityLevel, BiologicalSex, SportsObjective, UserProfile } from "@/types/profile";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  intense: 1.725,
};

/**
 * Ajustement en % du TDEE selon l'objectif.
 * Ex. −15 % → déficit modéré ; +10 % → surplus léger pour prise de masse.
 */
const OBJECTIVE_PERCENT: Record<SportsObjective, number> = {
  "weight-loss": -0.15,
  maintenance: 0,
  "muscle-gain": 0.1,
};

const BMR_SEX_OFFSET: Record<BiologicalSex, number> = {
  male: 5,
  female: -161,
};

const MIN_DAILY_CALORIES: Record<BiologicalSex, number> = {
  male: 1500,
  female: 1200,
};

type NutritionInput = Pick<
  UserProfile,
  "sex" | "age" | "weightKg" | "heightCm" | "activityLevel" | "sportsObjective"
>;

/** Mifflin-St Jeor — constante de sexe : +5 (homme), −161 (femme). */
export function calculateBmr(profile: Pick<UserProfile, "sex" | "age" | "weightKg" | "heightCm">) {
  return (
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    BMR_SEX_OFFSET[profile.sex]
  );
}

export function calculateNutritionDetails(profile: NutritionInput) {
  const bmr = calculateBmr(profile);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIER[profile.activityLevel]);
  const objectiveAdjustmentPercent = OBJECTIVE_PERCENT[profile.sportsObjective];
  const objectiveAdjustment = Math.round(tdee * objectiveAdjustmentPercent);
  const rawTarget = tdee + objectiveAdjustment;
  const minCalories = MIN_DAILY_CALORIES[profile.sex];
  const dailyCalorieTarget =
    Math.round(Math.max(minCalories, rawTarget) / 50) * 50;

  return {
    bmr: Math.round(bmr),
    tdee,
    objectiveAdjustmentPercent,
    objectiveAdjustment,
    minCalories,
    rawTarget: Math.round(rawTarget),
    dailyCalorieTarget,
    formula: "mifflin-st-jeor" as const,
    sexOffset: BMR_SEX_OFFSET[profile.sex],
  };
}

export function calculateCalorieTarget(profile: NutritionInput): number {
  return calculateNutritionDetails(profile).dailyCalorieTarget;
}

export { ACTIVITY_MULTIPLIER, OBJECTIVE_PERCENT, MIN_DAILY_CALORIES };
