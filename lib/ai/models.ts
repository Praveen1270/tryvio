/**
 * Public model identifiers (client-safe).
 *
 * This module contains NO secrets and NO provider construction — only plain
 * model ID strings. UI code that displays the model name must import from
 * here, never from `@/lib/ai/zen` (which reads OPENROUTER_API_KEY and must
 * stay server-side so the key can never end up in the browser bundle).
 */

/** Primary model — Nvidia Nemotron 3 Ultra free tier via OpenRouter */
export const PRIMARY_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

/**
 * Fallback model when the primary's upstream provider is unavailable.
 * Same Nemotron 3 family (smaller size, separate capacity pool) so output
 * shape/quality stays compatible. Must differ from PRIMARY_MODEL.
 */
export const FALLBACK_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
