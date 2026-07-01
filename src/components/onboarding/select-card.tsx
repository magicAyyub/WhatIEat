import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

type SelectCardProps = {
  emoji: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectCard({
  emoji,
  title,
  subtitle,
  selected,
  onPress,
}: SelectCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border px-4 py-4 mb-3 active:opacity-90"
      style={{
        backgroundColor: selected ? colors.sageMuted : colors.white,
        borderColor: selected ? colors.sage : colors.border,
        borderWidth: selected ? 2 : 1,
      }}
    >
      <AppText className="text-2xl">{emoji}</AppText>
      <View className="flex-1">
        <AppText className="text-[16px] font-semibold text-foreground">
          {title}
        </AppText>
        {subtitle ? (
          <AppText className="text-[13px] text-muted-foreground mt-0.5">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={22} color={colors.sage} />
      )}
    </Pressable>
  );
}
