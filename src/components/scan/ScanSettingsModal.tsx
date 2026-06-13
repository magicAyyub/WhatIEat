import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";

type Props = {
  visible: boolean;
  onClose: () => void;
  showBoxes: boolean;
  onShowBoxesChange: (v: boolean) => void;
  showMasks: boolean;
  onShowMasksChange: (v: boolean) => void;
  scoreThreshold: number;
  onScoreThresholdChange: (v: number) => void;
  boxesNote?: string;
};

export function ScanSettingsModal({
  visible,
  onClose,
  showBoxes,
  onShowBoxesChange,
  showMasks,
  onShowMasksChange,
  scoreThreshold,
  onScoreThresholdChange,
  boxesNote,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/45">
        <View
          className="rounded-t-3xl bg-white px-5 pt-5"
          style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <AppText className="text-xl font-semibold">Scan Settings</AppText>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </Pressable>
          </View>

          <View className="mb-3 rounded-xl bg-zinc-100 px-3 py-3">
            <View className="flex-row items-center justify-between">
              <AppText className="font-medium">Show bounding boxes</AppText>
              <Switch value={showBoxes} onValueChange={onShowBoxesChange} />
            </View>
            {boxesNote ? (
              <AppText className="mt-1 text-xs text-zinc-500">
                {boxesNote}
              </AppText>
            ) : null}
          </View>

          <View className="mb-3 rounded-xl bg-zinc-100 px-3 py-3">
            <View className="flex-row items-center justify-between">
              <AppText className="font-medium">Show segmentation masks</AppText>
              <Switch value={showMasks} onValueChange={onShowMasksChange} />
            </View>
            <AppText className="mt-1 text-xs text-zinc-500">
              Displays SAM masks when the backend returns them.
            </AppText>
          </View>

          <View className="rounded-xl bg-zinc-100 px-3 py-3">
            <AppText className="font-medium">Detection threshold</AppText>
            <View className="mt-2 flex-row items-center justify-between">
              <Pressable
                className="rounded-lg bg-zinc-200 px-3 py-1"
                onPress={() =>
                  onScoreThresholdChange(
                    Math.max(
                      0.1,
                      Math.round((scoreThreshold - 0.05) * 100) / 100,
                    ),
                  )
                }
              >
                <AppText className="text-base">-</AppText>
              </Pressable>
              <AppText className="text-base font-medium">
                {scoreThreshold.toFixed(2)}
              </AppText>
              <Pressable
                className="rounded-lg bg-zinc-200 px-3 py-1"
                onPress={() =>
                  onScoreThresholdChange(
                    Math.min(
                      0.95,
                      Math.round((scoreThreshold + 0.05) * 100) / 100,
                    ),
                  )
                }
              >
                <AppText className="text-base">+</AppText>
              </Pressable>
            </View>
            <AppText className="mt-2 text-xs text-zinc-500">
              Higher = fewer detections, lower = more detections.
            </AppText>
          </View>
        </View>
      </View>
    </Modal>
  );
}
