/**
 * app/(tabs)/profile.tsx
 * ───────────────────────
 * Profil utilisateur avec modification, déconnexion, accès aux recettes likées.
 */

import { AppText } from "@/components/ui/app-text";
import { ACTIVITY_LABELS, OBJECTIVE_LABELS } from "@/constants/onboarding";
import { colors } from "@/constants/colors";
import { useProfileStore } from "@/store/profile-store";
import { useAuthStore } from "@/store/auth-store";
import { useLikedStore } from "@/store/liked-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";

const macroSegments = [
  { label: "Protein", grams: "140g", percent: "27%", color: colors.macroProtein, flex: 0.27 },
  { label: "Carbs",   grams: "230g", percent: "44%", color: colors.macroCarbs,   flex: 0.44 },
  { label: "Fat",     grams: "70g",  percent: "29%", color: colors.macroFat,     flex: 0.29 },
];

export default function ProfileScreen() {
  const router           = useRouter();
  const { profile }      = useProfileStore();
  const { logout }       = useAuthStore();
  const { likedRecipes } = useLikedStore();
  const topPadding       = useScreenTopPadding();

  const initial           = profile.firstName.trim().charAt(0).toUpperCase() || "A";
  const allergiesSubtitle = profile.dietaryRestrictions.length > 0
    ? profile.dietaryRestrictions.join(" · ")
    : "No allergies listed";

  const profileSections = [
    { title: "Personal information", subtitle: `${profile.age} yrs · ${profile.weightKg} kg · ${profile.heightCm} cm`, icon: "person-outline" as const,        iconColor: colors.sage,        iconBg: colors.sageMuted, step: 0 },
    { title: "Goals",                subtitle: `${OBJECTIVE_LABELS[profile.sportsObjective]} · ${profile.calorieTarget} kcal/day`,                              icon: "flag-outline" as const,         iconColor: colors.sage,        iconBg: colors.sageMuted, step: 1 },
    { title: "Allergies",            subtitle: allergiesSubtitle,                                                                                               icon: "alert-circle-outline" as const, iconColor: colors.destructive, iconBg: colors.expiringBg, step: 2 },
    { title: "Physical activity",    subtitle: ACTIVITY_LABELS[profile.activityLevel],                                                                          icon: "barbell-outline" as const,      iconColor: colors.macroCarbs,  iconBg: "#FFEDD5",         step: 3 },
  ];

  const openEdit = (step: number) =>
    router.push({ pathname: "/onboarding", params: { edit: "true", step: String(step) } });

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out", style: "destructive",
        onPress: async () => { await logout(); router.replace("/auth/login"); },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <Pressable className="px-5 pb-6 active:opacity-90" style={{ paddingTop: topPadding }} onPress={() => openEdit(0)}>
        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: colors.sage }}>
            <AppText className="text-[28px] font-bold text-white">{initial}</AppText>
          </View>
          <View className="flex-1">
            <AppText className="text-[22px] font-bold text-foreground">{profile.firstName || "My profile"}</AppText>
            <AppText className="text-[14px] text-muted-foreground mt-0.5">
              {profile.age} yrs · {profile.weightKg} kg · {profile.heightCm} cm
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </View>
      </Pressable>

      <View className="px-5 gap-5">
        {/* Sections profil */}
        <View className="gap-2">
          {profileSections.map((s) => (
            <Pressable
              key={s.title} onPress={() => openEdit(s.step)}
              className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-90"
              style={{ backgroundColor: colors.white, borderColor: colors.border }}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: s.iconBg }}>
                <Ionicons name={s.icon} size={20} color={s.iconColor} />
              </View>
              <View className="flex-1">
                <AppText className="text-[15px] font-semibold text-foreground">{s.title}</AppText>
                <AppText className="text-[13px] text-muted-foreground mt-0.5" numberOfLines={2}>{s.subtitle}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          ))}
        </View>

        {/* Recettes likées */}
        <Pressable
          onPress={() => router.push("/(tabs)/liked")}
          className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-90"
          style={{ backgroundColor: colors.white, borderColor: colors.border }}
        >
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: "#FEE2E2" }}>
            <Ionicons name="heart" size={20} color={colors.destructive} />
          </View>
          <View className="flex-1">
            <AppText className="text-[15px] font-semibold text-foreground">Liked recipes</AppText>
            <AppText className="text-[13px] text-muted-foreground mt-0.5">
              {likedRecipes.length} saved recipe{likedRecipes.length !== 1 ? "s" : ""}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </Pressable>

        {/* Macros */}
        <View>
          <AppText className="text-[15px] font-bold text-foreground mb-3">Target macro split</AppText>
          <View className="rounded-2xl border p-4" style={{ backgroundColor: colors.white, borderColor: colors.border }}>
            <View className="flex-row h-3 rounded-full overflow-hidden mb-4">
              {macroSegments.map((seg) => <View key={seg.label} style={{ flex: seg.flex, backgroundColor: seg.color }} />)}
            </View>
            <View className="flex-row justify-between">
              {macroSegments.map((seg) => (
                <View key={seg.label} className="flex-1 items-center">
                  <AppText className="text-[16px] font-bold text-foreground">{seg.grams}</AppText>
                  <AppText className="text-[12px] text-muted-foreground mt-0.5">{seg.label}</AppText>
                  <AppText className="text-[12px] text-muted-foreground">{seg.percent}</AppText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Déconnexion */}
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 rounded-2xl py-4 border active:opacity-80"
          style={{ borderColor: colors.expiringBorder, backgroundColor: colors.expiringBg }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <AppText className="text-[15px] font-semibold" style={{ color: colors.destructive }}>Log out</AppText>
        </Pressable>
      </View>
    </ScrollView>
  );
}