import { AppText } from "@/components/ui/app-text";
import { Dialog, useThemeColor } from "heroui-native";
import { type FC, type PropsWithChildren } from "react";
import { View } from "react-native";

export const DialogHeader: FC<PropsWithChildren> = ({ children }) => {
  const themeColorMuted = useThemeColor("muted");

  return (
    <View className="mb-5 flex-row items-center justify-between">
      <AppText className="font-semibold text-lg text-muted">{children}</AppText>
      <Dialog.Close
        className="rounded-full bg-surface-secondary p-1"
        iconProps={{ size: 14, color: themeColorMuted }}
      />
    </View>
  );
};
