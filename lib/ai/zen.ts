import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { PRIMARY_MODEL, FALLBACK_MODEL } from "./models";

// Server-side only: this module reads OPENROUTER_API_KEY. Client components
// must import model IDs from "@/lib/ai/models" instead (see that file).
// Re-exported here so existing server imports keep working.
export { PRIMARY_MODEL, FALLBACK_MODEL };

if (!process.env.OPENROUTER_API_KEY) {
  console.warn("[openrouter] OPENROUTER_API_KEY is not set — LLM calls will fail");
}

export const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  headers: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Tryvio",
  },
});

/** @deprecated Use `openrouter` instead — kept for backwards compatibility */
export const zen = openrouter;

/**
 * OpenRouter-native routing options, forwarded into the chat-completions
 * request body by the OpenAI-compatible provider. `models` lets OpenRouter
 * itself fail over to the fallback model when the primary provider errors
 * (including 503 provider_overloaded) — the safest supported approach
 * before our own retry loop kicks in. Server-side only: never import from
 * client components (the API key must stay out of the browser).
 */
export function openRouterFallbackOptions(): {
  openrouter: { models: string[]; provider: { allow_fallbacks: boolean } };
} {
  return {
    openrouter: {
      models: [FALLBACK_MODEL],
      provider: { allow_fallbacks: true },
    },
  };
}

export const REQUEST_TIMEOUT_MS = 240_000;
export const MAX_RETRIES = 2;
export const MAX_OUTPUT_TOKENS = 8000;
export const TEMPERATURE = 0.2;

/** Exponential backoff delay in ms */
export function backoffDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 8000);
}
