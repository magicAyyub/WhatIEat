export type AppRuntimeConfig = {
  apiBaseUrl: string;
  vision: {
    targetClass: string | null;
    scoreThreshold: number;
    drawBoxesDefault: boolean;
  };
};

const runtimeConfig = require("./runtime-config.json") as AppRuntimeConfig;

export const APP_CONFIG: AppRuntimeConfig = runtimeConfig;
