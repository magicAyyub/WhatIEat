/**
 * services/api.ts
 * ────────────────
 * Client HTTP centralisé avec Bearer token JWT.
 * Toutes les routes backend passent par ici.
 */

import { APP_CONFIG } from "@/config/runtime";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = APP_CONFIG.apiBaseUrl;

const TOKEN_KEY   = "whatieat-token";
const USER_ID_KEY = "whatieat-user-id";

// ── Token storage ──────────────────────────────────────────────────────────

export const authStorage = {
  async saveToken(token: string, userId: number) {
    await AsyncStorage.multiSet([[TOKEN_KEY, token], [USER_ID_KEY, String(userId)]]);
  },
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },
  async getUserId(): Promise<number | null> {
    const id = await AsyncStorage.getItem(USER_ID_KEY);
    return id ? parseInt(id) : null;
  },
  async clear() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY]);
  },
};

// ── HTTP client ────────────────────────────────────────────────────────────

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(APP_CONFIG.apiKey ? { "X-API-Key": APP_CONFIG.apiKey } : {}),
  };

  if (auth) {
    const token = await authStorage.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Erreur ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string, auth = true)               => request<T>(path, { auth }),
  post:   <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: "POST",   body, auth }),
  put:    <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: "PUT",    body, auth }),
  delete: <T>(path: string, auth = true)               => request<T>(path, { method: "DELETE", auth }),
};