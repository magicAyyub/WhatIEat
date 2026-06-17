export type AppRuntimeConfig = {
  apiBaseUrl: string;
  apiKey?: string;
  vision: {
    targetClass: string | null;
    scoreThreshold: number;
    drawBoxesDefault: boolean;
    drawMasksDefault: boolean;
  };
};

const runtimeConfig = require("./runtime-config.json") as AppRuntimeConfig;

export const APP_CONFIG: AppRuntimeConfig = {
  ...runtimeConfig,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || runtimeConfig.apiBaseUrl,
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
};
