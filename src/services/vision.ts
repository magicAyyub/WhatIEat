import type { ScanResult } from "@/types/ingredient";

/**
 * Uploads a fridge photo to the backend and returns detected ingredients.
 * @param imageUri Local URI from expo-image-picker or expo-camera
 */
export async function uploadFridgeImage(imageUri: string): Promise<ScanResult> {
  const formData = new FormData();

  // React Native supports this shape for FormData file append
  formData.append("file", {
    uri: imageUri,
    name: "fridge.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const BASE_URL = "http://192.168.1.100:8000"; // TODO: share constant with api.ts
  const response = await fetch(`${BASE_URL}/vision/scan`, {
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
