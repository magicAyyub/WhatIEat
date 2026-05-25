import { defaultUserProfile, type UserProfile } from "@/types/profile";
import { calculateCalorieTarget } from "@/utils/calories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ProfileStore = {
  profile: UserProfile;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: defaultUserProfile,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      setProfile: (updates) => {
        const next = { ...get().profile, ...updates };
        const withCalories =
          updates.age !== undefined ||
          updates.weightKg !== undefined ||
          updates.heightCm !== undefined ||
          updates.activityLevel !== undefined ||
          updates.sportsObjective !== undefined
            ? {
                ...next,
                calorieTarget: calculateCalorieTarget(next),
              }
            : next;
        set({ profile: withCalories });
      },
      completeOnboarding: () => {
        const profile = get().profile;
        set({
          profile: {
            ...profile,
            hasCompletedOnboarding: true,
            calorieTarget: calculateCalorieTarget(profile),
          },
        });
      },
      resetOnboarding: () =>
        set({
          profile: { ...defaultUserProfile, hasCompletedOnboarding: false },
        }),
    }),
    {
      name: "whatieat-profile",
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ProfileStore> | undefined;
        return {
          ...current,
          ...saved,
          profile: { ...defaultUserProfile, ...saved?.profile },
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
