import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import type { Ingredient } from "@/types/ingredient";
import { getSafeIconName } from "@/helpers/utils/icons";

type Props = {
  loading: boolean;
  error: string | null;
  ingredients: Ingredient[];
  confidenceText: string;
  onScanAnother: () => void;
  onAddIngredients: () => void;
};

export function ScanResultPanel({
  loading,
  error,
  ingredients,
  confidenceText,
  onScanAnother,
  onAddIngredients,
}: Props) {
  const insets = useSafeAreaInsets();
  const hasIngredients = ingredients.length > 0;

  return (
    <View
      className="max-h-[420px] rounded-t-3xl bg-white px-5 pt-5 border-t border-zinc-100"
      style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-4 flex-row items-center justify-between">
          <AppText className="text-[20px] font-bold text-foreground">
            Scan results
          </AppText>
          <View
            className="rounded-full px-3 py-1 bg-zinc-50 border border-zinc-100"
          >
            <AppText className="text-[13px] font-semibold text-muted-foreground">
              Confidence {confidenceText}
            </AppText>
          </View>
        </View>

        {loading ? (
          <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-4">
            <ActivityIndicator color={colors.sage} />
            <AppText className="text-[15px] font-medium text-muted-foreground">
              Analyzing image...
            </AppText>
          </View>
        ) : null}

        {error ? (
          <View className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-4">
            <AppText className="text-[15px] font-medium text-red-600">
              {error}
            </AppText>
          </View>
        ) : null}

        {!loading && !error && !hasIngredients ? (
          <View className="mb-4 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-4">
            <AppText className="text-[15px] font-medium text-muted-foreground">
              No ingredients detected.
            </AppText>
          </View>
        ) : null}

        {!loading && hasIngredients ? (
          <View className="mb-4">
            <AppText className="mb-2.5 text-[14px] font-bold text-muted-foreground">
              Detected ingredients ({ingredients.length})
            </AppText>
            {ingredients.map((item) => (
              <View
                key={item.id}
                className="mb-2 flex-row items-center justify-between rounded-2xl border bg-white px-4 py-3"
                style={{ borderColor: colors.border }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-lg items-center justify-center bg-zinc-50 border border-zinc-100">
                    <MaterialCommunityIcons
                      name={getSafeIconName(item.icon) as any}
                      size={20}
                      color={colors.sage}
                    />
                  </View>
                  <AppText className="text-[15px] font-bold text-foreground">
                    {item.name}
                  </AppText>
                </View>
                <AppText className="text-[14px] font-semibold text-muted-foreground">
                  {item.quantity ? item.quantity : "detected"}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        <View className="gap-2.5 mt-2">
          {!loading && hasIngredients && (
            <Pressable
              className="items-center justify-center rounded-2xl py-4 active:opacity-90"
              style={{ backgroundColor: colors.sage }}
              onPress={onAddIngredients}
            >
              <AppText className="text-[16px] font-bold text-white">
                Add to fridge
              </AppText>
            </Pressable>
          )}

          <Pressable
            className="items-center justify-center rounded-2xl py-4 border active:opacity-90"
            style={
              !loading && hasIngredients
                ? {
                    backgroundColor: colors.white,
                    borderColor: colors.border,
                  }
                : {
                    backgroundColor: colors.sage,
                    borderColor: colors.sage,
                  }
            }
            onPress={onScanAnother}
          >
            <AppText
              className="text-[16px] font-bold"
              style={
                !loading && hasIngredients
                  ? { color: colors.mutedText }
                  : { color: colors.white }
              }
            >
              {!loading && hasIngredients ? "Take another photo" : "Scan a photo"}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
