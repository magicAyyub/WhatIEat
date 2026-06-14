import { API_BASE_URL } from "@/constants/api";
import type { OnboardingPayload } from "@/types/onboarding-payload";

/**
 * Envoie le profil utilisateur au backend WhatIEat.
 * Endpoint à aligner avec l'équipe backend (ex. POST /users/profile).
 */
export async function submitUserProfile(
  payload: OnboardingPayload,
): Promise<OnboardingPayload> {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Profile API ${response.status}${detail ? `: ${detail}` : ""}`,
    );
  }

  return response.json() as Promise<OnboardingPayload>;
}
