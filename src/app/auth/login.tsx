/**
 * app/auth/login.tsx
 */

import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/store/auth-store";
import { useNutritionStore } from "@/store/nutrition-store";
import { useProfileStore } from "@/store/profile-store";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth, loadFridgeFromDB } = useAuthStore();
  // nutrition store chargé via getState() après login
  const { setProfile } = useProfileStore();

  const [mode, setMode]           = useState<"login" | "register">("login");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Champs requis", "Email et mot de passe sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const res = mode === "login"
        ? await userService.login(email.trim(), password)
        : await userService.register(email.trim(), password, firstName.trim() || undefined);

      // 1. Sauvegarde le token
      setAuth(res.token, res.user_id);

      // 2. Si login → charge le profil depuis la DB pour récupérer
      //    has_completed_onboarding et les autres données
      if (mode === "login") {
        try {
          const dbProfile = await userService.getProfile();
          setProfile({
            firstName:              dbProfile.first_name               ?? "",
            age:                    dbProfile.age                      ?? 25,
            weightKg:               dbProfile.weight_kg                ?? 75,
            heightCm:               dbProfile.height_cm                ?? 178,
            sportsObjective:        dbProfile.sports_objective         ?? "maintenance",
            activityLevel:          dbProfile.activity_level           ?? "moderate",
            calorieTarget:          dbProfile.calorie_target           ?? 2100,
            dietaryRestrictions:    dbProfile.dietary_restrictions     ?? [],
            hasCompletedOnboarding: dbProfile.has_completed_onboarding ?? false,
          });
        } catch (e) {
          console.warn("Impossible de charger le profil DB:", e);
        }
      }

      // 3. Si login → recharge le frigo depuis la DB
      if (mode === "login") {
        await loadFridgeFromDB();
      }

      // 4. Charge le suivi nutritionnel depuis la DB (repas d'aujourd'hui)
      const { loadFromDB: loadNutrition } = useNutritionStore.getState();
      await loadNutrition();

      // 5. Redirige
      router.replace("/");
    } catch (e) {
      Alert.alert(
        mode === "login" ? "Connexion échouée" : "Inscription échouée",
        e instanceof Error ? e.message : "Erreur inconnue.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ backgroundColor: colors.cream }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top, 24) + 12,
          paddingBottom: Math.max(insets.bottom, 24) + 12,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-8">
          <View
            className="w-16 h-16 rounded-3xl items-center justify-center mb-4 shadow-sm"
            style={{
              backgroundColor: colors.sageMuted,
              shadowColor: colors.sage,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Ionicons name="restaurant-outline" size={32} color={colors.sage} />
          </View>
          <AppText className="text-[32px] font-bold text-foreground tracking-tight" style={{ fontFamily: "Inter_700Bold" }}>
            WhatIEat
          </AppText>
          <AppText className="text-[15px] text-muted-foreground mt-1.5 text-center">
            {mode === "login" ? "Heureux de te revoir !" : "Rejoins-nous pour mieux manger"}
          </AppText>
        </View>

        {/* Formulaire */}
        <View
          className="rounded-3xl border p-6 gap-4"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.border,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 16,
            elevation: 3,
          }}
        >
          {mode === "register" && (
            <View>
              <AppText className="text-[13px] font-medium text-foreground mb-1.5">Prénom</AppText>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Alex"
                className="rounded-xl border px-4 py-3.5 text-[15px]"
                style={{ borderColor: colors.border, backgroundColor: colors.cream }}
                placeholderTextColor={colors.mutedText}
              />
            </View>
          )}

          <View>
            <AppText className="text-[13px] font-medium text-foreground mb-1.5">Email</AppText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="alex@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="rounded-xl border px-4 py-3.5 text-[15px]"
              style={{ borderColor: colors.border, backgroundColor: colors.cream }}
              placeholderTextColor={colors.mutedText}
            />
          </View>

          <View>
            <AppText className="text-[13px] font-medium text-foreground mb-1.5">
              Mot de passe
            </AppText>
            <View className="relative justify-center">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                className="rounded-xl border pl-4 pr-12 py-3.5 text-[15px] w-full"
                style={{ borderColor: colors.border, backgroundColor: colors.cream }}
                placeholderTextColor={colors.mutedText}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 p-1 active:opacity-70"
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.mutedText}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="rounded-xl py-4 items-center mt-2 active:opacity-90"
            style={{ backgroundColor: colors.sage }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText className="text-[16px] font-bold text-white">
                {mode === "login" ? "Se connecter" : "S'inscrire"}
              </AppText>
            )}
          </Pressable>
        </View>

        {/* Toggle */}
        <Pressable
          onPress={() => {
            setMode(mode === "login" ? "register" : "login");
            setShowPassword(false);
          }}
          className="items-center mt-6 py-2"
        >
          <AppText className="text-[14px] text-muted-foreground">
            {mode === "login" ? "Pas encore de compte ? " : "Déjà un compte ? "}
            <AppText className="font-semibold" style={{ color: colors.sage }}>
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </AppText>
          </AppText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}