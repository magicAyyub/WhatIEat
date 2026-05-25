import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";

export type RecipeCardData = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  matchPercent: number;
  tags: string[];
  imageUrl: string;
};

type RecipeCardLargeProps = {
  recipe: RecipeCardData;
  showValidateButton?: boolean;
  onValidate?: () => void;
};

function TagPill({
  children,
  variant = "green",
}: {
  children: string;
  variant?: "white" | "green" | "blue";
}) {
  const bg =
    variant === "white"
      ? "rgba(255,255,255,0.95)"
      : variant === "blue"
        ? colors.tagBlue
        : colors.tagGreen;

  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: bg }}>
      <AppText
        className={`text-[11px] font-semibold ${
          variant === "white" ? "text-foreground" : "text-sage"
        }`}
      >
        {children}
      </AppText>
    </View>
  );
}

export function RecipeCardLarge({
  recipe,
  showValidateButton = false,
  onValidate,
}: RecipeCardLargeProps) {
  return (
    <View className="rounded-2xl bg-white overflow-hidden mb-4 border border-border">
      <View className="relative">
        <Image
          source={{ uri: recipe.imageUrl }}
          style={{ width: "100%", height: 176 }}
          contentFit="cover"
        />
        <View className="absolute top-3 left-3 right-3 flex-row flex-wrap gap-2">
          <TagPill variant="white">{`${recipe.matchPercent}% match`}</TagPill>
          {recipe.tags.map((tag, i) => (
            <TagPill key={tag} variant={i === 1 ? "blue" : "green"}>
              {tag}
            </TagPill>
          ))}
        </View>
      </View>

      <View className="p-4 gap-3">
        <AppText className="text-[17px] font-bold text-foreground leading-snug">
          {recipe.name}
        </AppText>

        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Ionicons name="flame" size={14} color={colors.macroCarbs} />
            <AppText className="text-[13px] text-muted-foreground">
              {recipe.calories} kcal
            </AppText>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={14} color={colors.mutedText} />
            <AppText className="text-[13px] text-muted-foreground">
              {recipe.time}
            </AppText>
          </View>
        </View>

        {showValidateButton && (
          <>
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center gap-1.5">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.macroProtein }}
                />
                <AppText className="text-[13px] text-muted-foreground">
                  P {recipe.protein}g
                </AppText>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.macroCarbs }}
                />
                <AppText className="text-[13px] text-muted-foreground">
                  C {recipe.carbs}g
                </AppText>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.macroFat }}
                />
                <AppText className="text-[13px] text-muted-foreground">
                  F {recipe.fat}g
                </AppText>
              </View>
            </View>

            <Pressable
              onPress={onValidate}
              className="flex-row items-center justify-center gap-2 rounded-xl py-3.5 active:opacity-90"
              style={{ backgroundColor: colors.sage }}
            >
              <Ionicons name="restaurant-outline" size={18} color="#fff" />
              <AppText className="text-[15px] font-semibold text-white">
                Valider ce repas
              </AppText>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
