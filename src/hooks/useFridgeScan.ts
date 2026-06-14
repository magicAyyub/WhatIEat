import { uploadFridgeImage } from "@/services/vision";
import { useFridgeStore } from "@/store";
import type { Ingredient } from "@/types/ingredient";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

type ScanOptions = {
  /** Ouvre la galerie au lieu de la caméra */
  source?: "camera" | "library";
  /** Navigue vers l’onglet Frigo après un scan réussi */
  navigateToFrigo?: boolean;
  /** Ferme un menu modal parent (ex. sheet Frigo) */
  onCloseMenu?: () => void;
};

export function useFridgeScan() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const { mergeScannedIngredients } = useFridgeStore();

  const applyScanResult = useCallback(
    (scanned: Ingredient[]) => {
      if (scanned.length === 0) {
        Alert.alert(
          "Aucun ingrédient détecté",
          "Essaie avec une photo plus nette et un frigo bien éclairé.",
        );
        return false;
      }
      mergeScannedIngredients(scanned);
      return true;
    },
    [mergeScannedIngredients],
  );

  const scanFridge = useCallback(
    async (options: ScanOptions = {}) => {
      const {
        source = "camera",
        navigateToFrigo = true,
        onCloseMenu,
      } = options;

      if (isScanning) return;

      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission refusée",
          source === "camera"
            ? "Autorise l'accès à la caméra dans les réglages pour scanner ton frigo."
            : "Autorise l'accès à la galerie pour importer une photo.",
        );
        return;
      }

      setIsScanning(true);
      onCloseMenu?.();

      try {
        const picker =
          source === "camera"
            ? ImagePicker.launchCameraAsync
            : ImagePicker.launchImageLibraryAsync;

        const result = await picker({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.85,
        });

        if (result.canceled || !result.assets[0]?.uri) {
          return;
        }

        const scanResult = await uploadFridgeImage(result.assets[0].uri);
        const ok = applyScanResult(scanResult.ingredients);

        if (!ok) return;

        const count = scanResult.ingredients.length;
        const confidence = Math.round(scanResult.confidence * 100);

        if (navigateToFrigo) {
          router.push("/(tabs)/frigo");
        }

        Alert.alert(
          "Scan terminé",
          `${count} ingrédient${count > 1 ? "s" : ""} détecté${count > 1 ? "s" : ""} (confiance ~${confidence}%).`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur inconnue";
        const isNetwork =
          message.includes("Network") || message.includes("Failed to fetch");

        Alert.alert(
          "Échec du scan",
          isNetwork
            ? "Impossible de joindre le serveur de détection. Vérifie que fridge_detector tourne (serve_api.py) et que EXPO_PUBLIC_API_URL pointe vers la bonne IP."
            : message,
        );
      } finally {
        setIsScanning(false);
      }
    },
    [applyScanResult, isScanning, router],
  );

  return { scanFridge, isScanning };
}
