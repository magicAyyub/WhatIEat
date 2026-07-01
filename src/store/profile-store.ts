/**
 * store/profile-store.ts
 * ───────────────────────
 * Profil utilisateur — sync automatique vers NeonDB.
 */

import { defaultUserProfile, type UserProfile } from "@/types/profile";
import { calculateCalorieTarget } from "@/utils/calories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { userService } from "@/services/userService";

type ProfileStore = {
  profile:            UserProfile;
  hydrated:           boolean;
  setHydrated:        (v: boolean) => void;
  setProfile:         (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetOnboarding:    () => void;
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile:  defaultUserProfile,
      hydrated: false,

      setHydrated: (v) => set({ hydrated: v }),

      setProfile: (updates) => {
        const next = { ...get().profile, ...updates };
        const withCalories =
          ["age", "weightKg", "heightCm", "activityLevel", "sportsObjective"]
            .some((k) => k in updates)
            ? { ...next, calorieTarget: calculateCalorieTarget(next) }
            : next;
        set({ profile: withCalories });
        // Sync silencieux vers NeonDB
        userService.syncProfileToDB(withCalories);
      },

      completeOnboarding: () => {
        const profile = get().profile;
        const updated = {
          ...profile,
          hasCompletedOnboarding: true,
          calorieTarget: calculateCalorieTarget(profile),
        };
        set({ profile: updated });
        userService.syncProfileToDB(updated);
      },

      resetOnboarding: () =>
        set({ profile: { ...defaultUserProfile, hasCompletedOnboarding: false } }),
    }),
    {
      name:    "whatieat-profile",
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ProfileStore> | undefined;
        return { ...current, ...saved, profile: { ...defaultUserProfile, ...saved?.profile } };
      },
      onRehydrateStorage: () => (state) => { state?.setHydrated(true); },
    },
  ),
);