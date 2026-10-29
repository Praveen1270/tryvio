"use client";

import { parseGenerationResponse } from "@/lib/ai/schema";
import {
  PROVIDER_BUSY_MESSAGE,
  PROVIDER_OVERLOADED_CODE,
  isAbortError,
  isOverloadedResponse,
} from "@/lib/ai/providerErrors";
import type { ProjectGeneration } from "@/lib/types";

export type GenStage =
  | "idle"
  | "contacting"
  | "receiving"
  | "building"
  | "ready"
  | "error"
  | "cancelled";

export interface StreamCallbacks {
  onStage: (stage: GenStage) => void;
  onProgress: (chars: number, elapsedMs: number) => void;
  /** First time the streamed text parses into a valid spec — render views now. */
  onSpec: (gen: ProjectGeneration) => void;
  onDone: (gen: ProjectGeneration) => void;
  onError: (message: string) => void;
}

function extractErrorMessage(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === "string") return parsed.error;
  } catch {
    // not JSON — ignore
  }
  return null;
}

function extractErrorCode(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.code === "string") return parsed.code;
  } catch {
    // not JSON — ignore
  }
  return null;
}

/**
 * Map an HTTP error response to a user-facing message. A 503 /
 * provider_overloaded means the AI provider is temporarily busy — say so
 * plainly instead of leaking upstream wording. Intentional cancellations
 * are handled by the caller and never reach here as errors.
 */
function friendlyErrorMessage(status: number, rawBody: string): string {
  const code = extractErrorCode(rawBody);
  if (
    status === 503 ||
    code === PROVIDER_OVERLOADED_CODE ||
    isOverloadedResponse(status, rawBody)
  ) {
    return PROVIDER_BUSY_MESSAGE;
  }
  if (status === 429) {
    return "AI rate limit reached. Please wait a moment and try again.";
  }
  const serverMessage = extractErrorMessage(rawBody);
  if (serverMessage) return serverMessage;
  const trimmed = rawBody.slice(0, 300).trim();
  return trimmed || `Generation failed (${status})`;
}

/**
 * Stream a generation (or patch) request. The server returns the raw model
 * output as a text stream. As chunks arrive we attempt to parse the
 * accumulated text — the moment it parses, views render (progressive
 * display) while the stream continues. Single LLM call, no polling,
 * cancellable via AbortController.
 */
export async function streamGeneration(
  endpoint: string,
  body: Record<string, unknown>,
  signal: AbortSignal,
  cb: StreamCallbacks
): Promise<void> {
  const startedAt = Date.now();
  cb.onStage("contacting");

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, streaming: true }),
      signal,
    });
  } catch (err) {
    // Intentional cancellation (e.g. a newer request superseded this one)
    // is not an error — report it as cancelled, silently.
    if (signal.aborted || isAbortError(err)) {
      cb.onStage("cancelled");
      return;
    }
    cb.onStage("error");
    cb.onError(err instanceof Error ? err.message : "Request failed");
    return;
  }

  if (!res.ok || !res.body) {
    // The fetch itself resolved, but a late abort still means "cancelled",
    // not an error worth showing.
    if (signal.aborted) {
      cb.onStage("cancelled");
      return;
    }
    let message = `Generation failed (${res.status})`;
    try {
      const text = await res.text();
      message = friendlyErrorMessage(res.status, text);
    } catch (err) {
      if (signal.aborted || isAbortError(err)) {
        cb.onStage("cancelled");
        return;
      }
      // keep default message
    }
    cb.onStage("error");
    cb.onError(message);
    return;
  }

  cb.onStage("receiving");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  let specEmitted = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
      cb.onProgress(raw.length, Date.now() - startedAt);

      if (!specEmitted) {
        const parsed = parseGenerationResponse(raw);
        if (parsed.success) {
          specEmitted = true;
          cb.onStage("building");
          cb.onSpec(parsed.data as unknown as ProjectGeneration);
        }
      }
    }
    raw += decoder.decode();
  } catch (err) {
    if (signal.aborted || isAbortError(err)) {
      // Keep already-rendered spec; don't wipe progress on cancel.
      cb.onStage("cancelled");
      return;
    }
    cb.onStage("error");
    cb.onError(err instanceof Error ? err.message : "Stream interrupted");
    return;
  }

  const parsed = parseGenerationResponse(raw);
  if (parsed.success) {
    const gen = parsed.data as unknown as ProjectGeneration;
    if (!specEmitted) cb.onSpec(gen);
    cb.onStage("ready");
    cb.onDone(gen);
  } else {
    cb.onStage("error");
    cb.onError(
      raw.length === 0
        ? "The model returned an empty response. Please try again."
        : `Could not parse the model response: ${parsed.error}`
    );
  }
}
