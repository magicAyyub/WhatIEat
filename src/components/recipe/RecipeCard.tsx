import { AppText } from "@/components/ui/app-text";
import type { Recipe } from "@/types/ingredient";
import { type FC } from "react";
import { Image, Pressable, View } from "react-native";

type Props = {
  recipe: Recipe;
  onPress: () => void;
};

export const RecipeCard: FC<Props> = ({ recipe, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-2xl overflow-hidden shadow-surface mb-3"
    >
      {recipe.imageUrl && (
        <Image
          source={{ uri: recipe.imageUrl }}
          className="w-full h-40"
          resizeMode="cover"
        />
      )}
      <View className="p-4 gap-1">
        <AppText className="text-foreground font-semibold text-base">
          {recipe.title}
        </AppText>
        <AppText className="text-muted text-sm" numberOfLines={2}>
          {recipe.description}
        </AppText>
        <View className="flex-row gap-4 mt-2">
          <AppText className="text-muted text-xs">
            {recipe.calories} kcal
          </AppText>
          <AppText className="text-muted text-xs">
            {recipe.prepTimeMinutes} min
          </AppText>
        </View>
      </View>
    </Pressable>
  );
};
