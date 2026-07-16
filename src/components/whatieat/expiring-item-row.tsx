import { AppText } from "@/components/ui/app-text";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { Pressable, View } from "react-native";
import { resolveIngredientIcon } from "@/helpers/utils/icons";

export type ExpiringItem = {
  name: string;
  quantity: string;
  expiresIn?: number;
  icon: string;
};

type ExpiringItemRowProps = {
  item: ExpiringItem;
  onPress?: () => void;
};

function formatExpiry(expiresIn?: number) {
  if (expiresIn === undefined) return null;
  if (expiresIn === 0) return "Today";
  return `${expiresIn}d`;
}

export function ExpiringItemRow({ item, onPress }: ExpiringItemRowProps) {
  const expiryLabel = formatExpiry(item.expiresIn);
  const isUrgent = item.expiresIn !== undefined && item.expiresIn <= 1;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl border px-4 py-3.5"
      style={{
        backgroundColor: colors.expiringBg,
        borderColor: colors.expiringBorder,
      }}
    >
      <View className="flex-row items-center gap-3.5 flex-1">
        <View className="w-10 h-10 rounded-xl items-center justify-center bg-zinc-50 border border-zinc-100">
          <MaterialCommunityIcons
            name={resolveIngredientIcon(item.name, item.icon) as any}
            size={22}
            color={colors.sage}
          />
        </View>
        <View className="flex-1">
          <AppText className="text-[15px] font-semibold text-foreground">
            {item.name}
          </AppText>
          <AppText className="text-[13px] text-muted-foreground mt-0.5">
            {item.quantity}
          </AppText>
        </View>
      </View>
      {expiryLabel && (
        <View className="flex-row items-center gap-1">
          <Ionicons name="warning" size={14} color={colors.destructive} />
          <AppText
            className={`text-[13px] font-semibold ${
              isUrgent ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {expiryLabel}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
