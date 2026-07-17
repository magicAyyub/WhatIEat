import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


import { CameraCapture } from "@/components/scan/CameraCapture";
import { DetectionOverlay } from "@/components/scan/DetectionOverlay";
import { ScanResultPanel } from "@/components/scan/ScanResultPanel";
import { ScanSettingsModal } from "@/components/scan/ScanSettingsModal";
import { PREVIEW_SIZE } from "@/helpers/utils/scan";
import { useScanner } from "@/hooks/useScanner";
import { useFridgeStore } from "@/store";

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const insets = useSafeAreaInsets();


  const {
    mode,
    loading,
    error,
    lastImageUri,
    detections,
    showBoxes,
    setShowBoxes,
    showMasks,
    setShowMasks,
    scoreThreshold,
    setScoreThreshold,
    settingsOpen,
    setSettingsOpen,
    confidenceText,
    scannedIngredients,
    handleCapture,
    resetToCamera,
  } = useScanner();

  useEffect(() => {
    if (params.imageUri) {
      handleCapture(params.imageUri);
    }
  }, [params.imageUri]);

  const handleReset = () => {
    router.setParams({ imageUri: undefined });
    resetToCamera();
  };

  const handleAddIngredients = async () => {
    // 1. Sauvegarde locale
    useFridgeStore.getState().addIngredients(scannedIngredients);

    // 2. Sauvegarde en DB
    try {
      const { userService } = await import("@/services/userService");
      const items = scannedIngredients.map((ing) => ({
        ingredient_name: ing.name,
        quantity:        parseFloat(ing.quantity ?? "1") || 1,
        unit:            (ing.quantity ?? "").replace(/^[0-9.]+\s*/, "").trim() || "pieces",
        expires_at:      ing.expiresAt ?? undefined,
        category:        ing.category ?? undefined,
      }));
      await userService.syncFridgeToDB(scannedIngredients);
    } catch (e) {
      console.warn("Sauvegarde DB scan échouée:", e);
    }

    router.replace("/(tabs)/frigo");
  };

  const settingsButton = (
    <Pressable
      className="h-11 w-11 items-center justify-center rounded-full bg-black/45"
      onPress={() => setSettingsOpen(true)}
    >
      <Ionicons name="settings-outline" size={22} color="white" />
    </Pressable>
  );

  const settingsModal = (
    <ScanSettingsModal
      visible={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      showBoxes={showBoxes}
      onShowBoxesChange={setShowBoxes}
      showMasks={showMasks}
      onShowMasksChange={setShowMasks}
      scoreThreshold={scoreThreshold}
      onScoreThresholdChange={setScoreThreshold}
      boxesNote={
        mode === "camera" && !params.imageUri
          ? "Default comes from runtime-config.json. This switch changes current session only."
          : "Turn off for a cleaner result view."
      }
    />
  );

  if (mode === "camera" && !params.imageUri) {
    return (
      <View className="flex-1 bg-black">
        <CameraCapture
          onCapture={handleCapture}
          topRightOverlay={settingsButton}
        />
        {settingsModal}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="flex-1 items-center justify-start px-4" style={{ paddingTop: insets.top + 16 }}>
        <View className="mb-3 w-full max-h-77.5 flex-row items-center justify-between">

          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full bg-black/45"
            onPress={handleReset}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>
          {settingsButton}
        </View>

        {lastImageUri ? (
          <View
            className="overflow-hidden rounded-2xl"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
          >
            <Image
              source={{ uri: lastImageUri }}
              style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
              resizeMode="cover"
            />
            <DetectionOverlay
              detections={detections}
              showBoxes={showBoxes}
              showMasks={showMasks}
            />
          </View>
        ) : null}
      </View>

      <ScanResultPanel
        loading={loading}
        error={error}
        ingredients={scannedIngredients}
        confidenceText={confidenceText}
        onScanAnother={handleReset}
        onAddIngredients={handleAddIngredients}
      />

      {settingsModal}
    </View>
  );
}