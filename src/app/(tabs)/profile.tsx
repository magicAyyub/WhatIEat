import { AppText } from "@/components/ui/app-text";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <AppText className="text-lg font-medium">Profile Screen</AppText>

      {__DEV__ && (
        <Pressable
          onPress={() => router.push("/_showcase")}
          className="absolute bottom-8 opacity-30"
        >
          <AppText className="text-xs text-muted">Dev: UI Showcase</AppText>
        </Pressable>
      )}
    </View>
  );
}

// ------------------------------------------------------------------------------
