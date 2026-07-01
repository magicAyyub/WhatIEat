export type SportsObjective = "weight-loss" | "muscle-gain" | "maintenance";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "intense";

export type UserProfile = {
  firstName: string;
  age: number;
  weightKg: number;
  heightCm: number;
  sportsObjective: SportsObjective;
  dietaryRestrictions: string[];
  activityLevel: ActivityLevel;
  calorieTarget: number;
  hasCompletedOnboarding: boolean;
};

export const defaultUserProfile: UserProfile = {
  firstName: "",
  age: 25,
  weightKg: 75,
  heightCm: 178,
  sportsObjective: "maintenance",
  dietaryRestrictions: [],
  activityLevel: "moderate",
  calorieTarget: 2100,
  hasCompletedOnboarding: false,
};
