import { RecipeCardLarge } from "@/components/whatieat/recipe-card-large";
import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { lunchRecipes } from "@/constants/mock-data";
import { Ionicons } from "@expo/vector-icons";
import { useProfileStore } from "@/store/profile-store";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

const mealTimes = ["Petit-déj", "Déjeuner", "Dîner", "Snack"];

export default function RecipesScreen() {
  const { profile } = useProfileStore();
  const [activeTime, setActiveTime] = useState("Déjeuner");
  const caloriesRemaining = Math.max(0, (profile.calorieTarget || 2100) - 1240);

  const recipes = useMemo(() => {
    const base = activeTime === "Déjeuner" ? lunchRecipes : [];
    if (profile.dietaryRestrictions.length === 0) return base;
    const restrictions = profile.dietaryRestrictions.map((r) => r.toLowerCase());
    return base.filter(
      (recipe) =>
        !restrictions.some(
          (r) =>
            recipe.tags.some((t) => t.toLowerCase().includes(r)) ||
            recipe.name.toLowerCase().includes(r),
        ),
    );
  }, [activeTime, profile.dietaryRestrictions]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-5 pt-14 pb-4">
        <View className="flex-row justify-between items-center">
          <AppText className="text-[26px] font-bold text-foreground">
            Recettes 🍽️
          </AppText>
          <Pressable
            className="w-10 h-10 rounded-full items-center justify-center border"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="funnel-outline" size={20} color={colors.mutedText} />
          </Pressable>
        </View>
        <AppText className="text-[15px] text-muted-foreground mt-1">
          Basées sur votre frigo et vos objectifs
        </AppText>
      </View>

      <View className="px-5 gap-4">
        <View
          className="flex-row rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.border,
          }}
        >
          <View className="flex-1 items-center py-4 px-2 border-r border-border">
            <AppText className="text-[22px] font-bold text-foreground">
              {caloriesRemaining}
            </AppText>
            <AppText className="text-[12px] text-muted-foreground text-center mt-1">
              kcal restantes
            </AppText>
          </View>
          <View className="flex-1 items-center py-4 px-2 border-r border-border">
            <AppText
              className="text-[22px] font-bold"
              style={{ color: colors.macroProtein }}
            >
              72g
            </AppText>
            <AppText className="text-[12px] text-muted-foreground text-center mt-1">
              protéines à combler
            </AppText>
          </View>
          <View className="flex-1 items-center py-4 px-2">
            <AppText
              className="text-[22px] font-bold"
              style={{ color: colors.sage }}
            >
              4
            </AppText>
            <AppText className="text-[12px] text-muted-foreground text-center mt-1">
              recettes dispo
            </AppText>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {mealTimes.map((time) => {
            const active = activeTime === time;
            return (
              <Pressable key={time} onPress={() => setActiveTime(time)}>
                <View
                  className="rounded-full px-4 py-2"
                  style={{
                    backgroundColor: active ? colors.sage : colors.white,
                    borderWidth: active ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  <AppText
                    className={`text-[13px] font-medium ${
                      active ? "text-white" : "text-muted-foreground"
                    }`}
                  >
                    {time}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <RecipeCardLarge
              key={recipe.name}
              recipe={recipe}
              showValidateButton
              onValidate={() =>
                Alert.alert("Repas validé", `${recipe.name} ajouté à votre journée.`)
              }
            />
          ))
        ) : (
          <View className="items-center py-16">
            <AppText className="text-[15px] text-muted-foreground text-center">
              Aucune recette pour ce moment
            </AppText>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
