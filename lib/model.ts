/**
 * Model provider — NVIDIA Nemotron 3 Ultra via NIM.
 * Works with the current API key (Moonshot models hang).
 */

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";

export const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

export const nim = createOpenAICompatible({
  name: "nim",
  baseURL: NIM_BASE_URL,
  apiKey: process.env.NVIDIA_API_KEY,
});

/** Chat model used for tutoring and the parallel classifiers. */
export function socratiaModel() {
  return nim.chatModel(process.env.SOCRATIA_MODEL ?? DEFAULT_MODEL);
}
