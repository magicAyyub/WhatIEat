import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { ActivityIndicator, Modal, View } from "react-native";

type ScanningOverlayProps = {
  visible: boolean;
  message?: string;
};

export function ScanningOverlay({
  visible,
  message = "Analyse de ton frigo en cours…",
}: ScanningOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <View
          className="rounded-2xl px-6 py-5 items-center w-full max-w-xs"
          style={{ backgroundColor: colors.white }}
        >
          <ActivityIndicator size="large" color={colors.sage} />
          <AppText className="text-[15px] font-semibold text-foreground mt-4 text-center">
            {message}
          </AppText>
        </View>
      </View>
    </Modal>
  );
}
