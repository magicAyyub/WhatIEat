import { APP_CONFIG } from "@/config/runtime";
import type { ScanResult } from "@/types/ingredient";
import { BASE_URL } from "@/services/api";

type ScanOptions = {
  scoreThreshold?: number;
};

/**
 * Uploads a fridge photo to the backend and returns detected ingredients.
 * @param imageUri Local URI from expo-image-picker or expo-camera
 */
export async function uploadFridgeImage(
  imageUri: string,
  options: ScanOptions = {},
): Promise<ScanResult> {
  const formData = new FormData();

  // React Native supports this shape for FormData file append
  formData.append("file", {
    uri: imageUri,
    name: "fridge.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const params = new URLSearchParams();
  const threshold = options.scoreThreshold ?? APP_CONFIG.vision.scoreThreshold;
  params.set("score_threshold", String(threshold));
  if (APP_CONFIG.vision.targetClass) {
    params.set("target_class", APP_CONFIG.vision.targetClass);
  }

  const response = await fetch(`${BASE_URL}/vision/scan?${params.toString()}`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type here — fetch sets it automatically with the boundary
  });

  if (!response.ok) {
    throw new Error(
      `Vision API error ${response.status}: ${response.statusText}`,
    );
  }

  return response.json() as Promise<ScanResult>;
}
