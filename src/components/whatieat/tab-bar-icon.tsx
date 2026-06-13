import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

type TabIconName =
  | "home-outline"
  | "cube-outline"
  | "restaurant-outline"
  | "cart-outline"
  | "person-outline";

type TabBarIconProps = {
  name: TabIconName;
  focused: boolean;
  size?: number;
};

export function TabBarIcon({ name, focused, size = 24 }: TabBarIconProps) {
  const color = focused ? colors.sage : colors.mutedText;

  return (
    <View className="items-center justify-center min-w-[56px] h-full relative">
      {focused && (
        <View
          className="absolute rounded-full"
          style={{
            top: -6,
            width: 28,
            height: 3,
            backgroundColor: colors.sage,
          }}
        />
      )}
      <Ionicons name={name} size={size} color={color} style={{ marginTop: 4 }} />
    </View>
  );
}
