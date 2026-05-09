// Base URL for the FastAPI backend.
// Set your local IP or production URL here.
import { APP_CONFIG } from "@/config/runtime";

export const BASE_URL = APP_CONFIG.apiBaseUrl;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: BodyInit;
  headers?: Record<string, string>;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
};
