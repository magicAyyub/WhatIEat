import { AppText } from "@/components/ui/app-text";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { withUniwind } from "uniwind";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const StyledIonicons = withUniwind(Ionicons);

export default function ProfileScreen() {
  const foreground = useThemeColor("foreground");
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center">
      <AppText className="text-lg font-medium">Profile Screen</AppText>

      {__DEV__ && (
        <AnimatedPressable
          onPress={() => router.push("/_showcase")}
          style={animatedStyle}
          className="absolute bottom-8 flex-row items-center gap-2 bg-foreground/10 border border-foreground/20 rounded-2xl px-4 py-3"
        >
          <StyledIonicons
            name="color-palette-outline"
            size={16}
            color={foreground}
          />
          <AppText className="text-sm font-medium">UI Showcase</AppText>
          <StyledIonicons
            name="arrow-forward"
            size={14}
            color={foreground}
            className="opacity-50"
          />
        </AnimatedPressable>
      )}
    </View>
  );
}

// ------------------------------------------------------------------------------
