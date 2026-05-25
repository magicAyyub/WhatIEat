import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { ONBOARDING_STEPS } from "@/constants/onboarding";
import { Ionicons } from "@expo/vector-icons";
import React, { type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type OnboardingShellProps = {
  step: number;
  title: string;
  headerIcon: React.ComponentProps<typeof Ionicons>["name"];
  onBack?: () => void;
  children: ReactNode;
  footer: ReactNode;
};

export function OnboardingShell({
  step,
  title,
  headerIcon,
  onBack,
  children,
  footer,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-5 pt-2 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          {onBack ? (
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full items-center justify-center border active:opacity-80"
              style={{
                backgroundColor: colors.white,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
            </Pressable>
          ) : (
            <View className="w-10" />
          )}

          <AppText className="text-[13px] text-muted-foreground">
            Étape {step} / {ONBOARDING_STEPS}
          </AppText>

          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.sage }}
          >
            <Ionicons name={headerIcon} size={20} color="#fff" />
          </View>
        </View>

        <AppText className="text-[28px] font-bold text-foreground mb-4">
          {title}
        </AppText>

        <View className="flex-row gap-1.5">
          {Array.from({ length: ONBOARDING_STEPS }).map((_, i) => (
            <View
              key={i}
              className="flex-1 h-1.5 rounded-full"
              style={{
                backgroundColor: i < step ? colors.sage : "#E8E6E1",
              }}
            />
          ))}
        </View>
      </View>

      <View className="flex-1 px-5">{children}</View>

      <View
        className="px-5 pt-3 border-t border-border"
        style={{
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          backgroundColor: colors.cream,
        }}
      >
        {footer}
      </View>
    </View>
  );
}
