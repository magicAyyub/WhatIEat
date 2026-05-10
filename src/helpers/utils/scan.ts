import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Image as RNImage } from "react-native";

import type { Detection } from "@/types/ingredient";

export const MODEL_IMAGE_SIZE = 512;
export const PREVIEW_SIZE = 340;

export async function cropToInferenceSquare(imageUri: string): Promise<string> {
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

export function scaleBox(d: Detection) {
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

export function scalePolygon(points: [number, number][]) {
  const scale = PREVIEW_SIZE / MODEL_IMAGE_SIZE;
  return points
    .map(([x, y]) => {
      const sx = Math.max(0, Math.min(PREVIEW_SIZE, x * scale));
      const sy = Math.max(0, Math.min(PREVIEW_SIZE, y * scale));
      return `${sx},${sy}`;
    })
    .join(" ");
}
