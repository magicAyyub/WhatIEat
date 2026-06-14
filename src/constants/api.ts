import Constants from "expo-constants";

/**
 * URL du backend FastAPI (fridge_detector).
 * Définir EXPO_PUBLIC_API_URL dans .env — ex. http://192.168.1.42:8000
 * Émulateur Android : http://10.0.2.2:8000 · iOS simulateur : http://localhost:8000
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:8000";
