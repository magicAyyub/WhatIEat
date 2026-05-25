import { useProfileStore } from "@/store/profile-store";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@/constants/colors";

export default function RootScreen() {
  const { profile, hydrated } = useProfileStore();

  if (!hydrated) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.cream }}
      >
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  if (!profile.hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
