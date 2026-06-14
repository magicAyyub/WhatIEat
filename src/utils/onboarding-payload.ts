import {
  ACTIVITY_LABELS,
  OBJECTIVE_LABELS,
  SEX_LABELS,
} from "@/constants/onboarding";
import type { OnboardingPayload } from "@/types/onboarding-payload";
import type { UserProfile } from "@/types/profile";
import { calculateNutritionDetails } from "@/utils/calories";

/** Construit le payload JSON standard à partir du profil utilisateur. */
export function buildOnboardingPayload(
  profile: UserProfile,
  options?: { completedAt?: string },
): OnboardingPayload {
  const details = calculateNutritionDetails(profile);

  return {
    completedAt: options?.completedAt ?? new Date().toISOString(),
    user: {
      firstName: profile.firstName.trim(),
      sex: profile.sex,
      sexLabel: SEX_LABELS[profile.sex],
      age: profile.age,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
    },
    goals: {
      objective: profile.sportsObjective,
      objectiveLabel: OBJECTIVE_LABELS[profile.sportsObjective],
      activityLevel: profile.activityLevel,
      activityLabel: ACTIVITY_LABELS[profile.activityLevel],
    },
    restrictions: {
      allergiesAndIntolerances: profile.dietaryRestrictions,
    },
    nutrition: {
      dailyCalorieTarget: details.dailyCalorieTarget,
      unit: "kcal",
      calculation: {
        formula: details.formula,
        sexOffset: details.sexOffset,
        bmr: details.bmr,
        tdee: details.tdee,
        objectiveAdjustmentPercent: details.objectiveAdjustmentPercent,
        objectiveAdjustment: details.objectiveAdjustment,
        minCalories: details.minCalories,
      },
    },
  };
}

/** Sérialise le payload en chaîne JSON (indentée par défaut). */
export function toOnboardingJson(
  profile: UserProfile,
  options?: { pretty?: boolean; completedAt?: string },
): string {
  const payload = buildOnboardingPayload(profile, {
    completedAt: options?.completedAt,
  });
  return JSON.stringify(payload, null, options?.pretty === false ? undefined : 2);
}
