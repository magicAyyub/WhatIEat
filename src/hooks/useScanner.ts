import { useMemo, useState } from "react";

import { APP_CONFIG } from "@/config/runtime";
import { cropToInferenceSquare } from "@/helpers/utils/scan";
import { uploadFridgeImage } from "@/services/vision";
import { useFridgeStore } from "@/store";
import type { Detection } from "@/types/ingredient";

export type ScreenMode = "camera" | "result";

export function useScanner() {
  const setIngredients = useFridgeStore((s) => s.setIngredients);
  const ingredients = useFridgeStore((s) => s.ingredients);

  const [mode, setMode] = useState<ScreenMode>("camera");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [lastImageUri, setLastImageUri] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [showBoxes, setShowBoxes] = useState(
    APP_CONFIG.vision.drawBoxesDefault,
  );
  const [showMasks, setShowMasks] = useState(
    APP_CONFIG.vision.drawMasksDefault,
  );
  const [scoreThreshold, setScoreThreshold] = useState(
    APP_CONFIG.vision.scoreThreshold,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasIngredients = ingredients.length > 0;

  const confidenceText = useMemo(() => {
    if (lastConfidence == null) return "-";
    return `${Math.round(lastConfidence * 100)}%`;
  }, [lastConfidence]);

  async function handleCapture(imageUri: string) {
    setError(null);
    setMode("result");
    setLoading(true);

    try {
      const croppedUri = await cropToInferenceSquare(imageUri);
      setLastImageUri(croppedUri);

      const result = await uploadFridgeImage(croppedUri, { scoreThreshold });
      setIngredients(result.ingredients);
      setLastConfidence(result.confidence);
      setDetections(result.detections ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Scan failed";
      setError(message);
      setDetections([]);
    } finally {
      setLoading(false);
    }
  }

  function resetToCamera() {
    setIngredients([]);
    setLastConfidence(null);
    setError(null);
    setDetections([]);
    setLastImageUri(null);
    setMode("camera");
  }

  return {
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
    hasIngredients,
    confidenceText,
    ingredients,
    handleCapture,
    resetToCamera,
  };
}
