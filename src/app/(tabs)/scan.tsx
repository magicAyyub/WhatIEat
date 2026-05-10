import { CameraCapture } from "@/components/scan/CameraCapture";
import { AppText } from "@/components/ui/app-text";
import { APP_CONFIG } from "@/config/runtime";
import { uploadFridgeImage } from "@/services/vision";
import { useFridgeStore } from "@/store";
import type { Detection } from "@/types/ingredient";
import { Ionicons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    Image as RNImage,
    ScrollView,
    Switch,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polygon } from "react-native-svg";

const MODEL_IMAGE_SIZE = 512;
const PREVIEW_SIZE = 340;

type ScreenMode = "camera" | "result";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
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
    if (lastConfidence == null) {
      return "-";
    }
    return `${Math.round(lastConfidence * 100)}%`;
  }, [lastConfidence]);

  async function cropToInferenceSquare(imageUri: string): Promise<string> {
    const { width, height } = await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) => {
      RNImage.getSize(
        imageUri,
        (w, h) => resolve({ width: w, height: h }),
        (err) => reject(err),
      );
    });

    const side = Math.min(width, height);
    const originX = Math.floor((width - side) / 2);
    const originY = Math.floor((height - side) / 2);

    const out = await manipulateAsync(
      imageUri,
      [{ crop: { originX, originY, width: side, height: side } }],
      { compress: 0.92, format: SaveFormat.JPEG },
    );

    return out.uri;
  }

  async function handleCapture(imageUri: string) {
    setError(null);
    setMode("result");
    setLoading(true);

    try {
      const croppedUri = await cropToInferenceSquare(imageUri);
      setLastImageUri(croppedUri);

      const result = await uploadFridgeImage(croppedUri, {
        scoreThreshold,
      });
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

  function scaleBox(d: Detection) {
    const scale = PREVIEW_SIZE / MODEL_IMAGE_SIZE;
    const left = Math.max(0, Math.min(PREVIEW_SIZE, d.box.x1 * scale));
    const top = Math.max(0, Math.min(PREVIEW_SIZE, d.box.y1 * scale));
    const right = Math.max(0, Math.min(PREVIEW_SIZE, d.box.x2 * scale));
    const bottom = Math.max(0, Math.min(PREVIEW_SIZE, d.box.y2 * scale));
    return {
      left,
      top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top),
    };
  }

  function scalePolygon(points: [number, number][]) {
    const scale = PREVIEW_SIZE / MODEL_IMAGE_SIZE;
    return points
      .map(([x, y]) => {
        const sx = Math.max(0, Math.min(PREVIEW_SIZE, x * scale));
        const sy = Math.max(0, Math.min(PREVIEW_SIZE, y * scale));
        return `${sx},${sy}`;
      })
      .join(" ");
  }

  const settingsButton = (
    <Pressable
      className="h-11 w-11 items-center justify-center rounded-full bg-black/45"
      onPress={() => setSettingsOpen(true)}
    >
      <Ionicons name="settings-outline" size={22} color="white" />
    </Pressable>
  );

  if (mode === "camera") {
    return (
      <View className="flex-1 bg-black">
        <CameraCapture
          onCapture={handleCapture}
          topRightOverlay={settingsButton}
        />

        <Modal
          visible={settingsOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setSettingsOpen(false)}
        >
          <View className="flex-1 justify-end bg-black/45">
            <View
              className="rounded-t-3xl bg-white px-5 pt-5"
              style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}
            >
              <View className="mb-4 flex-row items-center justify-between">
                <AppText className="text-xl font-semibold">
                  Scan Settings
                </AppText>
                <Pressable onPress={() => setSettingsOpen(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </Pressable>
              </View>

              <View className="mb-3 rounded-xl bg-zinc-100 px-3 py-3">
                <View className="flex-row items-center justify-between">
                  <AppText className="font-medium">Show bounding boxes</AppText>
                  <Switch value={showBoxes} onValueChange={setShowBoxes} />
                </View>
                <AppText className="mt-1 text-xs text-zinc-500">
                  Default comes from runtime-config.json. This switch changes
                  current session only.
                </AppText>
              </View>

              <View className="mb-3 rounded-xl bg-zinc-100 px-3 py-3">
                <View className="flex-row items-center justify-between">
                  <AppText className="font-medium">
                    Show segmentation masks
                  </AppText>
                  <Switch value={showMasks} onValueChange={setShowMasks} />
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
                      setScoreThreshold((v) =>
                        Math.max(0.1, Math.round((v - 0.05) * 100) / 100),
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
                      setScoreThreshold((v) =>
                        Math.min(0.95, Math.round((v + 0.05) * 100) / 100),
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
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="flex-1 items-center justify-start px-4 pt-14">
        <View className="mb-3 w-full max-h-77.5 flex-row items-center justify-between">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full bg-black/45"
            onPress={resetToCamera}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>

          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full bg-black/45"
            onPress={() => setSettingsOpen(true)}
          >
            <Ionicons name="settings-outline" size={22} color="white" />
          </Pressable>
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

            {showMasks ? (
              <Svg
                width={PREVIEW_SIZE}
                height={PREVIEW_SIZE}
                style={{ position: "absolute", left: 0, top: 0 }}
              >
                {detections.map((d, idx) => {
                  const polygon = d.mask?.polygon;
                  if (!polygon || polygon.length < 3) {
                    return null;
                  }
                  return (
                    <Polygon
                      key={`mask-${d.name}-${idx}`}
                      points={scalePolygon(polygon)}
                      fill="rgba(34,197,94,0.20)"
                      stroke="rgba(34,197,94,0.9)"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </Svg>
            ) : null}

            {showBoxes
              ? detections.map((d, idx) => {
                  const b = scaleBox(d);
                  return (
                    <View
                      key={`${d.name}-${idx}`}
                      style={{
                        position: "absolute",
                        left: b.left,
                        top: b.top,
                        width: b.width,
                        height: b.height,
                        borderColor: "#22c55e",
                        borderWidth: 2,
                      }}
                    >
                      <View
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          backgroundColor: "#22c55e",
                          paddingHorizontal: 4,
                          paddingVertical: 1,
                        }}
                      >
                        <AppText className="text-xs text-white">
                          {d.name} {d.score.toFixed(2)}
                        </AppText>
                      </View>
                    </View>
                  );
                })
              : null}
          </View>
        ) : null}
      </View>

      <View
        className="max-h-77.5 rounded-t-3xl bg-white px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-3 flex-row items-center justify-between">
            <AppText className="text-2xl font-semibold">Scan result</AppText>
            <View className="rounded-full bg-zinc-100 px-3 py-1">
              <AppText className="text-sm text-zinc-700">
                Confidence {confidenceText}
              </AppText>
            </View>
          </View>

          {loading ? (
            <View className="mb-3 flex-row items-center gap-2 rounded-xl bg-zinc-100 px-3 py-3">
              <ActivityIndicator />
              <AppText>Analyzing image...</AppText>
            </View>
          ) : null}

          {error ? (
            <View className="mb-3 rounded-xl bg-red-50 px-3 py-3">
              <AppText className="text-red-600">{error}</AppText>
            </View>
          ) : null}

          {!loading && !error && !hasIngredients ? (
            <View className="mb-3 rounded-xl bg-zinc-100 px-3 py-3">
              <AppText className="text-zinc-700">
                No matching items detected.
              </AppText>
            </View>
          ) : null}

          {hasIngredients ? (
            <View className="mb-3">
              <AppText className="mb-2 font-medium">
                Detected items ({ingredients.length})
              </AppText>
              {ingredients.map((item) => (
                <View
                  key={item.id}
                  className="mb-2 flex-row items-center justify-between rounded-lg bg-zinc-100 px-3 py-2"
                >
                  <AppText className="font-medium">{item.name}</AppText>
                  <AppText className="text-zinc-500">
                    {item.quantity ? `×${item.quantity}` : "detected"}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            className="items-center rounded-xl bg-zinc-900 px-4 py-3"
            onPress={resetToCamera}
          >
            <AppText className="text-white">Scan another photo</AppText>
          </Pressable>
        </ScrollView>
      </View>

      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/45">
          <View
            className="rounded-t-3xl bg-white px-5 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom + 14, 24) }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <AppText className="text-xl font-semibold">Scan Settings</AppText>
              <Pressable onPress={() => setSettingsOpen(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </Pressable>
            </View>

            <View className="mb-3 rounded-xl bg-zinc-100 px-3 py-3">
              <View className="flex-row items-center justify-between">
                <AppText className="font-medium">Show bounding boxes</AppText>
                <Switch value={showBoxes} onValueChange={setShowBoxes} />
              </View>
              <AppText className="mt-1 text-xs text-zinc-500">
                Turn off for a cleaner result view.
              </AppText>
            </View>

            <View className="mb-3 rounded-xl bg-zinc-100 px-3 py-3">
              <View className="flex-row items-center justify-between">
                <AppText className="font-medium">
                  Show segmentation masks
                </AppText>
                <Switch value={showMasks} onValueChange={setShowMasks} />
              </View>
              <AppText className="mt-1 text-xs text-zinc-500">
                Uses mask polygons returned by backend SAM inference.
              </AppText>
            </View>

            <View className="rounded-xl bg-zinc-100 px-3 py-3">
              <AppText className="font-medium">Detection threshold</AppText>
              <View className="mt-2 flex-row items-center justify-between">
                <Pressable
                  className="rounded-lg bg-zinc-200 px-3 py-1"
                  onPress={() =>
                    setScoreThreshold((v) =>
                      Math.max(0.1, Math.round((v - 0.05) * 100) / 100),
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
                    setScoreThreshold((v) =>
                      Math.min(0.95, Math.round((v + 0.05) * 100) / 100),
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
    </View>
  );
}
