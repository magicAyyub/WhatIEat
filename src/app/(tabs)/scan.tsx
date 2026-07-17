import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";

import { IngredientFormModal } from "@/components/fridge/IngredientFormModal";
import { CameraCapture } from "@/components/scan/CameraCapture";
import { DetectionOverlay } from "@/components/scan/DetectionOverlay";
import { ScanResultPanel } from "@/components/scan/ScanResultPanel";
import { ScanSettingsModal } from "@/components/scan/ScanSettingsModal";
import { PREVIEW_SIZE } from "@/helpers/utils/scan";
import { useScanner } from "@/hooks/useScanner";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { userService } from "@/services/userService";
import { useFridgeStore } from "@/store";
import { useAuthStore } from "@/store/auth-store";
import type { Ingredient } from "@/types/ingredient";

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const topPadding = useScreenTopPadding();

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

  const handleAddIngredients = async (selected: typeof scannedIngredients) => {
    if (selected.length === 0) return;

    useFridgeStore.getState().addIngredients(selected);

    try {
      await userService.syncFridgeToDB(selected);
    } catch (e) {
      console.warn("Sauvegarde DB scan échouée:", e);
    }

    router.replace("/(tabs)/frigo");
  };

  const handleManualSave = async (ingredient: Ingredient) => {
    useFridgeStore.getState().addIngredients([ingredient]);

    if (isAuthenticated) {
      try {
        const qty = parseFloat(ingredient.quantity ?? "1") || 1;
        const unit =
          (ingredient.quantity ?? "").replace(/^[0-9.]+\s*/, "").trim() || "pieces";
        await userService.addFridgeItem({
          ingredient_name: ingredient.name,
          quantity: qty,
          unit,
          expires_at: ingredient.expiresAt,
          category: ingredient.category,
        });
      } catch (e) {
        console.warn("Add DB échoué:", e);
      }
    }

    router.replace("/(tabs)/frigo");
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/frigo");
    }
  };

  const closeButton = (
    <Pressable
      className="h-11 w-11 items-center justify-center rounded-full bg-black/45"
      onPress={handleClose}
    >
      <Ionicons name="close" size={24} color="white" />
    </Pressable>
  );

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
          topLeftOverlay={closeButton}
          topRightOverlay={settingsButton}
        />
        {settingsModal}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="flex-1 items-center justify-start px-4" style={{ paddingTop: topPadding }}>
        <View className="mb-3 w-full max-h-77.5 flex-row items-center justify-between">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full bg-black/45"
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="white" />
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
        onAddManually={() => setManualFormOpen(true)}
      />

      <IngredientFormModal
        visible={manualFormOpen}
        onClose={() => setManualFormOpen(false)}
        onSave={handleManualSave}
      />

      {settingsModal}
    </View>
  );
}
