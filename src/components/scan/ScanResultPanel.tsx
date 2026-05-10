import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import type { Ingredient } from "@/types/ingredient";

type Props = {
  loading: boolean;
  error: string | null;
  hasIngredients: boolean;
  ingredients: Ingredient[];
  confidenceText: string;
  onScanAnother: () => void;
};

export function ScanResultPanel({
  loading,
  error,
  hasIngredients,
  ingredients,
  confidenceText,
  onScanAnother,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="max-h-77.5 rounded-t-3xl bg-white px-5 pt-4"
      style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-3 flex-row items-center justify-between">
          <AppText className="text-2xl font-semibold">Scan result</AppText>
          <View className="rounded-full bg-zinc-100 px-3 py-1">
            <AppText className="text-sm text-zinc-700">
              Confidence {confidenceText}
            </AppText>
          </View>
        </View>

        {loading ? (
          <View className="mb-3 flex-row items-center gap-2 rounded-xl bg-zinc-100 px-3 py-3">
            <ActivityIndicator />
            <AppText>Analyzing image...</AppText>
          </View>
        ) : null}

        {error ? (
          <View className="mb-3 rounded-xl bg-red-50 px-3 py-3">
            <AppText className="text-red-600">{error}</AppText>
          </View>
        ) : null}

        {!loading && !error && !hasIngredients ? (
          <View className="mb-3 rounded-xl bg-zinc-100 px-3 py-3">
            <AppText className="text-zinc-700">
              No matching items detected.
            </AppText>
          </View>
        ) : null}

        {hasIngredients ? (
          <View className="mb-3">
            <AppText className="mb-2 font-medium">
              Detected items ({ingredients.length})
            </AppText>
            {ingredients.map((item) => (
              <View
                key={item.id}
                className="mb-2 flex-row items-center justify-between rounded-lg bg-zinc-100 px-3 py-2"
              >
                <AppText className="font-medium">{item.name}</AppText>
                <AppText className="text-zinc-500">
                  {item.quantity ? `×${item.quantity}` : "detected"}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          className="items-center rounded-xl bg-zinc-900 px-4 py-3"
          onPress={onScanAnother}
        >
          <AppText className="text-white">Scan another photo</AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}
