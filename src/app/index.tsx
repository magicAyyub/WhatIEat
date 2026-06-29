/**
 * app/index.tsx
 * ──────────────
 * Attend que le store auth soit hydraté AVANT de charger les données DB.
 * Fix : "Token expiré ou invalide" au démarrage car token pas encore disponible.
 */

import { useAuthStore } from "@/store/auth-store";
import { useProfileStore } from "@/store/profile-store";
import { useNutritionStore } from "@/store/nutrition-store";
import { Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@/constants/colors";

export default function RootScreen() {
  const { hydrated: authHydrated, isAuthenticated, loadFridgeFromDB } = useAuthStore();
  const { hydrated: profileHydrated, profile } = useProfileStore();
  const loadNutrition = useNutritionStore((s) => s.loadFromDB);

  const [dbLoaded, setDbLoaded] = useState(false);
  const loadStarted = useRef(false);

  useEffect(() => {
    // N'essaie de charger depuis la DB que quand :
    // 1. Le store auth EST hydraté (token disponible en mémoire)
    // 2. L'utilisateur EST authentifié
    // 3. On n'a pas déjà commencé à charger
    if (!authHydrated || !isAuthenticated || loadStarted.current) return;

    loadStarted.current = true;

    const loadData = async () => {
      try {
        // Lance les deux en parallèle
        await Promise.allSettled([
          loadFridgeFromDB(),
          loadNutrition(),
        ]);
      } catch (e) {
        console.warn("Chargement données au démarrage échoué:", e);
      } finally {
        setDbLoaded(true);
      }
    };

    loadData();
  }, [authHydrated, isAuthenticated]);

  // Marque comme chargé si non authentifié (pas besoin de charger la DB)
  useEffect(() => {
    if (authHydrated && !isAuthenticated) {
      setDbLoaded(true);
    }
  }, [authHydrated, isAuthenticated]);

  const isReady =
    authHydrated &&
    profileHydrated &&
    (dbLoaded || !isAuthenticated);

  if (!isReady) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.cream }}
      >
        <ActivityIndicator color={colors.sage} size="large" />
      </View>
    );
  }

  if (!isAuthenticated)                return <Redirect href="/auth/login" />;
  if (!profile.hasCompletedOnboarding) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}