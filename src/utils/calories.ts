import type { ActivityLevel, SportsObjective, UserProfile } from "@/types/profile";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  intense: 1.725,
};

/** Estimation BMR (Mifflin-St Jeor, base neutre) puis TDEE selon l'activité. */
export function calculateCalorieTarget(
  profile: Pick<
    UserProfile,
    "age" | "weightKg" | "heightCm" | "activityLevel" | "sportsObjective"
  >,
): number {
  const bmr =
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    5;

  let tdee = bmr * ACTIVITY_MULTIPLIER[profile.activityLevel];

  const objectiveAdjust: Record<SportsObjective, number> = {
    "weight-loss": -400,
    "muscle-gain": 300,
    maintenance: 0,
  };

  tdee += objectiveAdjust[profile.sportsObjective];

  return Math.round(Math.max(1200, tdee) / 50) * 50;
}
