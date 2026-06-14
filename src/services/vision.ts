import { API_BASE_URL } from "@/constants/api";
import type { Ingredient, ScanResult } from "@/types/ingredient";

type VisionScanResponse = {
  ingredients: Array<{ id: string; name: string; quantity?: string }>;
  confidence: number;
};

/**
 * Envoie une photo de frigo au backend fridge_detector (POST /vision/scan).
 * @see https://github.com/magicAyyub/fridge_detector
 */
export async function uploadFridgeImage(imageUri: string): Promise<ScanResult> {
  const formData = new FormData();

  formData.append("file", {
    uri: imageUri,
    name: "fridge.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const response = await fetch(
    `${API_BASE_URL}/vision/scan?score_threshold=0.35`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Vision API ${response.status}${detail ? `: ${detail}` : ""}`,
    );
  }

  const data = (await response.json()) as VisionScanResponse;

  const ingredients: Ingredient[] = (data.ingredients ?? []).map((item) => ({
    id: item.id ?? item.name,
    name: item.name,
    quantity: item.quantity,
  }));

  return {
    ingredients,
    confidence: data.confidence ?? 0,
  };
}

/** Vérifie que le serveur fridge_detector répond. */
export async function checkVisionHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}
