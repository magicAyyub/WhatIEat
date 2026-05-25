import { AppText } from "@/components/ui/app-text";
import {
  ACTIVITY_LABELS,
  OBJECTIVE_LABELS,
} from "@/constants/onboarding";
import { colors } from "@/constants/colors";
import { useProfileStore } from "@/store/profile-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

const macroSegments = [
  { label: "Protéines", grams: "140g", percent: "27%", color: colors.macroProtein, flex: 0.27 },
  { label: "Glucides", grams: "230g", percent: "44%", color: colors.macroCarbs, flex: 0.44 },
  { label: "Lipides", grams: "70g", percent: "29%", color: colors.macroFat, flex: 0.29 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfileStore();

  const initial =
    profile.firstName.trim().charAt(0).toUpperCase() || "A";

  const allergiesSubtitle =
    profile.dietaryRestrictions.length > 0
      ? profile.dietaryRestrictions.join(" · ")
      : "Aucune allergie renseignée";

  const profileSections = [
    {
      title: "Informations personnelles",
      subtitle: `${profile.age} ans · ${profile.weightKg} kg · ${profile.heightCm} cm`,
      icon: "person-outline" as const,
      iconColor: colors.sage,
      iconBg: colors.sageMuted,
      step: 0,
    },
    {
      title: "Objectifs",
      subtitle: `${OBJECTIVE_LABELS[profile.sportsObjective]} · ${profile.calorieTarget} kcal/jour`,
      icon: "flag-outline" as const,
      iconColor: colors.sage,
      iconBg: colors.sageMuted,
      step: 1,
    },
    {
      title: "Allergies & restrictions",
      subtitle: allergiesSubtitle,
      icon: "alert-circle-outline" as const,
      iconColor: colors.destructive,
      iconBg: colors.expiringBg,
      step: 2,
    },
    {
      title: "Activité physique",
      subtitle: ACTIVITY_LABELS[profile.activityLevel],
      icon: "barbell-outline" as const,
      iconColor: colors.macroCarbs,
      iconBg: "#FFEDD5",
      step: 3,
    },
  ];

  const openEdit = (step: number) => {
    router.push({
      pathname: "/onboarding",
      params: { edit: "true", step: String(step) },
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        className="px-5 pt-14 pb-6 active:opacity-90"
        onPress={() => openEdit(0)}
      >
        <View className="flex-row items-center gap-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.sage }}
          >
            <AppText className="text-[28px] font-bold text-white">
              {initial}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText className="text-[22px] font-bold text-foreground">
              {profile.firstName || "Mon profil"}
            </AppText>
            <AppText className="text-[14px] text-muted-foreground mt-0.5">
              {profile.age} ans · {profile.weightKg} kg · {profile.heightCm} cm
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </View>
      </Pressable>

      <View className="px-5 gap-5">
        <View className="gap-2">
          {profileSections.map((section) => (
            <Pressable
              key={section.title}
              onPress={() => openEdit(section.step)}
              className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-90"
              style={{
                backgroundColor: colors.white,
                borderColor: colors.border,
              }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: section.iconBg }}
              >
                <Ionicons
                  name={section.icon}
                  size={20}
                  color={section.iconColor}
                />
              </View>
              <View className="flex-1">
                <AppText className="text-[15px] font-semibold text-foreground">
                  {section.title}
                </AppText>
                <AppText
                  className="text-[13px] text-muted-foreground mt-0.5"
                  numberOfLines={2}
                >
                  {section.subtitle}
                </AppText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.mutedText}
              />
            </Pressable>
          ))}
        </View>

        <View>
          <AppText className="text-[15px] font-bold text-foreground mb-3">
            Répartition cible des macros
          </AppText>
          <View
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row h-3 rounded-full overflow-hidden mb-4">
              {macroSegments.map((seg) => (
                <View
                  key={seg.label}
                  style={{ flex: seg.flex, backgroundColor: seg.color }}
                />
              ))}
            </View>
            <View className="flex-row justify-between">
              {macroSegments.map((seg) => (
                <View key={seg.label} className="flex-1 items-center">
                  <AppText className="text-[16px] font-bold text-foreground">
                    {seg.grams}
                  </AppText>
                  <AppText className="text-[12px] text-muted-foreground mt-0.5">
                    {seg.label}
                  </AppText>
                  <AppText className="text-[12px] text-muted-foreground">
                    {seg.percent}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
