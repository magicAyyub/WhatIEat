import { ExpiringItemRow } from "@/components/whatieat/expiring-item-row";
import { MacroRing } from "@/components/whatieat/macro-ring";
import { RecipeCardLarge } from "@/components/whatieat/recipe-card-large";
import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import {
  featuredHomeRecipe,
  homeExpiringItems,
} from "@/constants/mock-data";
import { Ionicons } from "@expo/vector-icons";
import { useProfileStore } from "@/store/profile-store";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

const CALORIES_CURRENT = 1240;
const DEFAULT_CALORIE_TARGET = 2100;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const calorieTarget = profile.calorieTarget || DEFAULT_CALORIE_TARGET;
  const caloriesRemaining = Math.max(0, calorieTarget - CALORIES_CURRENT);
  const calorieProgress = CALORIES_CURRENT / calorieTarget;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-14 pb-5">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name="sunny-outline" size={14} color={colors.macroCarbs} />
                <AppText className="text-[14px] text-muted-foreground">
                  {getGreeting()}
                </AppText>
              </View>
              <AppText className="text-[26px] font-bold text-foreground leading-tight">
                Mon suivi nutrition
              </AppText>
            </View>
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.sage }}
            >
              <AppText className="text-[17px] font-bold text-white">
                {profile.firstName.trim().charAt(0).toUpperCase() || "A"}
              </AppText>
            </View>
          </View>
        </View>

        <View className="px-5 gap-5">
          <View
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row justify-between items-start mb-1">
              <View>
                <AppText className="text-[14px] font-medium text-muted-foreground">
                  Aujourd&apos;hui
                </AppText>
                <AppText className="text-[15px] font-semibold text-foreground mt-1">
                  {caloriesRemaining} kcal restantes
                </AppText>
              </View>
              <View className="items-end">
                <AppText className="text-[22px] font-bold text-foreground leading-none">
                  {CALORIES_CURRENT}
                  <AppText className="text-[15px] font-semibold text-muted-foreground">
                    /{calorieTarget}
                  </AppText>
                </AppText>
                <AppText className="text-[12px] text-muted-foreground mt-0.5">
                  kcal
                </AppText>
              </View>
            </View>

            <View
              className="h-3 rounded-full overflow-hidden mt-4 mb-5"
              style={{ backgroundColor: colors.border }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${calorieProgress * 100}%`,
                  backgroundColor: colors.sage,
                }}
              />
            </View>

            <View className="flex-row justify-between gap-2">
              <MacroRing
                value={68}
                max={140}
                color={colors.macroProtein}
                label="Protéines"
              />
              <MacroRing
                value={120}
                max={260}
                color={colors.macroCarbs}
                label="Glucides"
              />
              <MacroRing
                value={42}
                max={70}
                color={colors.macroFat}
                label="Lipides"
              />
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/frigo")}
            className="flex-row items-center gap-4 rounded-2xl px-4 py-4 active:opacity-90"
            style={{ backgroundColor: colors.sage }}
          >
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Ionicons name="camera-outline" size={26} color="#fff" />
            </View>
            <View className="flex-1">
              <AppText className="text-[16px] font-bold text-white">
                Scanne ton frigo
              </AppText>
              <AppText className="text-[13px] text-white/85 mt-0.5">
                Ajoute tes ingrédients en un clic grâce à l&apos;IA
              </AppText>
            </View>
          </Pressable>

          {homeExpiringItems.length > 0 && (
            <View>
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="flash" size={16} color={colors.macroCarbs} />
                  <AppText className="text-[15px] font-bold text-foreground">
                    À consommer vite
                  </AppText>
                </View>
                <Pressable onPress={() => router.push("/(tabs)/frigo")}>
                  <AppText
                    className="text-[13px] font-semibold"
                    style={{ color: colors.sage }}
                  >
                    Voir le frigo →
                  </AppText>
                </Pressable>
              </View>
              <View className="gap-2">
                {homeExpiringItems.map((item) => (
                  <ExpiringItemRow
                    key={item.name}
                    item={item}
                    onPress={() => router.push("/(tabs)/frigo")}
                  />
                ))}
              </View>
            </View>
          )}

          <View>
            <View className="flex-row items-center gap-1.5 mb-3">
              <Ionicons name="sparkles" size={16} color={colors.macroCarbs} />
              <AppText className="text-[15px] font-bold text-foreground">
                Suggestions pour vous
              </AppText>
            </View>
            <RecipeCardLarge recipe={featuredHomeRecipe} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
