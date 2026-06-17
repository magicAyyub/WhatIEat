import { ExpiringItemRow } from "@/components/whatieat/expiring-item-row";
import { MacroRing } from "@/components/whatieat/macro-ring";
import { RecipeCardLarge } from "@/components/whatieat/recipe-card-large";
import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import {
  featuredHomeRecipe,
} from "@/constants/mock-data";
import { Ionicons } from "@expo/vector-icons";
import { useProfileStore } from "@/store/profile-store";
import { useFridgeStore } from "@/store";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const CALORIES_CURRENT = 1240;
const DEFAULT_CALORIE_TARGET = 2100;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const calorieTarget = profile.calorieTarget || DEFAULT_CALORIE_TARGET;
  const caloriesRemaining = Math.max(0, calorieTarget - CALORIES_CURRENT);
  const calorieProgress = CALORIES_CURRENT / calorieTarget;

  const ingredients = useFridgeStore((s) => s.ingredients);
  const homeExpiringItems = ingredients
    .map((ing) => {
      let expiresIn = undefined;
      if (ing.expiresAt) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(ing.expiresAt);
        exp.setHours(0, 0, 0, 0);
        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        expiresIn = Math.max(0, diffDays);
      }
      return {
        name: ing.name,
        quantity: ing.quantity || "1",
        expiresIn,
        icon: ing.icon || "food-variant",
      };
    })
    .filter((i) => i.expiresIn !== undefined && i.expiresIn <= 2);

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
                My nutrition tracker
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
                  Today
                </AppText>
                <AppText className="text-[15px] font-semibold text-foreground mt-1">
                  {caloriesRemaining} kcal remaining
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
                label="Protein"
              />
              <MacroRing
                value={120}
                max={260}
                color={colors.macroCarbs}
                label="Carbs"
              />
              <MacroRing
                value={42}
                max={70}
                color={colors.macroFat}
                label="Fat"
              />
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/scan")}
            className="rounded-2xl overflow-hidden active:opacity-90 shadow-sm border border-zinc-100 relative"
          >
            <LinearGradient
              colors={["#3D6B4D", "#588E6B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <View className="flex-row items-center gap-4 px-5 py-5">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center shadow-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              >
                <Ionicons name="camera-outline" size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <View className="bg-white/20 rounded-full px-2 py-0.5">
                    <AppText className="text-[10px] font-bold text-white uppercase tracking-wider">
                      AI Detection
                    </AppText>
                  </View>
                </View>
                <AppText className="text-[17px] font-bold text-white leading-tight">
                  Scan your fridge
                </AppText>
                <AppText className="text-[13px] text-white/80 mt-1 leading-snug">
                  Take a photo to identify and add your ingredients in one tap
                </AppText>
              </View>
              <View className="w-8 h-8 rounded-full items-center justify-center bg-white/10">
                <Ionicons name="chevron-forward-outline" size={18} color="#fff" />
              </View>
            </View>
          </Pressable>

          {homeExpiringItems.length > 0 && (
            <View>
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="flash" size={16} color={colors.macroCarbs} />
                  <AppText className="text-[15px] font-bold text-foreground">
                    Use soon
                  </AppText>
                </View>
                <Pressable onPress={() => router.push("/(tabs)/frigo")}>
                  <AppText
                    className="text-[13px] font-semibold"
                    style={{ color: colors.sage }}
                  >
                    View fridge →
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
                Suggestions for you
              </AppText>
            </View>
            <RecipeCardLarge recipe={featuredHomeRecipe} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
