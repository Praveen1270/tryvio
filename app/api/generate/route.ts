import { streamText, generateText } from "ai";
import { NextRequest } from "next/server";
import {
  openrouter,
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  MAX_OUTPUT_TOKENS,
  TEMPERATURE,
  backoffDelay,
  openRouterFallbackOptions,
} from "@/lib/ai/zen";
import {
  isAuthError,
  isRetryableProviderError,
  toProviderErrorPayload,
} from "@/lib/ai/providerErrors";
import {
  SYSTEM_PROMPT,
  buildGenerationMessages,
  buildRetryMessages,
  type AIMessage,
} from "@/lib/ai/prompts";
import { parseGenerationResponse } from "@/lib/ai/schema";
import { getBoardContext } from "@/lib/knowledge/boards";
import { detectComponents, getComponentContext } from "@/lib/knowledge/components";
import { getEdbSpecsContext } from "@/lib/knowledge/edb";

export const maxDuration = 300;

/** Bounded wait — part of the retry loop, never infinite. */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Streaming mode with provider-overload handling.
 *
 * Verifies the first text chunk before committing to HTTP 200, so an
 * overloaded provider surfaces as a clean non-2xx JSON error instead of a
 * 200 stream that dies mid-flight. Once the first chunk arrives the
 * response streams normally (streaming behavior preserved).
 */
async function streamWithProviderFallback(
  req: NextRequest,
  messages: AIMessage[]
): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(backoffDelay(attempt - 1));
    }
    if (req.signal.aborted) {
      return Response.json({ error: "Request cancelled", code: "cancelled" }, { status: 499 });
    }

    const modelId = attempt === MAX_RETRIES ? FALLBACK_MODEL : PRIMARY_MODEL;

    try {
      const result = streamText({
        model: openrouter(modelId),
        system: SYSTEM_PROMPT,
        messages,
        timeout: REQUEST_TIMEOUT_MS,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
        // Retries are handled explicitly below (bounded + backoff); the
        // SDK must not add its own hidden retry loop on top.
        maxRetries: 0,
        abortSignal: req.signal,
        // OpenRouter-native fallback: OpenRouter itself tries FALLBACK_MODEL
        // when the primary provider errors (incl. 503 provider_overloaded).
        providerOptions: openRouterFallbackOptions(),
      });

      // Pull the first chunk before sending headers: a provider failure
      // (503 overloaded, auth, empty stream) throws here, where we can
      // still answer with the correct non-2xx status.
      const reader = result.textStream.getReader();
      let first: ReadableStreamReadResult<string>;
      try {
        first = await reader.read();
      } catch (readErr) {
        try {
          reader.releaseLock();
        } catch {
          // ignore — releasing a released/errored reader throws
        }
        throw readErr;
      }
      if (first.done) {
        try {
          reader.releaseLock();
        } catch {
          // ignore
        }
        throw new Error("The model returned an empty response.");
      }

      const stream = new ReadableStream<string>({
        start(controller) {
          controller.enqueue(first.value);
          const pump = async () => {
            try {
              for (;;) {
                const next = await reader.read();
                if (next.done) break;
                controller.enqueue(next.value);
              }
              controller.close();
            } catch (pumpErr) {
              controller.error(pumpErr);
            } finally {
              reader.releaseLock();
            }
          };
          void pump();
        },
        cancel() {
          void reader.cancel().catch(() => {
            // client went away — nothing to report
          });
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      if (req.signal.aborted) {
        return Response.json({ error: "Request cancelled", code: "cancelled" }, { status: 499 });
      }
      // Auth failures and non-transient errors: retrying cannot help.
      if (isAuthError(err) || !isRetryableProviderError(err)) {
        const payload = toProviderErrorPayload(err);
        console.error("[generate] streaming failed:", payload.code ?? payload.status, payload.error);
        return Response.json(
          payload.code ? { error: payload.error, code: payload.code } : { error: payload.error },
          { status: payload.status }
        );
      }
      if (attempt === MAX_RETRIES) {
        const payload = toProviderErrorPayload(err);
        console.error("[generate] streaming failed:", payload.code ?? payload.status, payload.error);
        return Response.json(
          payload.code ? { error: payload.error, code: payload.code } : { error: payload.error },
          { status: payload.status }
        );
      }
      // Transient provider error with attempts left — back off and retry.
    }
  }

  return Response.json(
    {
      error: "AI provider is temporarily overloaded. Please try again.",
      code: "provider_overloaded",
    },
    { status: 503 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      boardId = "esp32-c3-devkitm-1",
      streaming = false,
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    const boardContext = getBoardContext(boardId);
    const detectedComponents = detectComponents(prompt);
    const componentContext = getComponentContext(detectedComponents);
    const edbSpecs = getEdbSpecsContext(detectedComponents.map((c) => c.id));
    const messages = buildGenerationMessages(prompt, boardContext, componentContext, edbSpecs);

    // Streaming mode — text stream for the chat panel (see helper above).
    if (streaming) {
      return streamWithProviderFallback(req, messages);
    }

    // Non-streaming: fetch full response, validate, return JSON
    let lastError = "";
    let lastThrown: unknown = null;
    let currentMessages: AIMessage[] = messages;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(backoffDelay(attempt - 1));
      }

      const model = attempt === MAX_RETRIES ? openrouter(FALLBACK_MODEL) : openrouter(PRIMARY_MODEL);

      try {
        const result = await generateText({
          model,
          system: SYSTEM_PROMPT,
          messages: currentMessages,
          timeout: REQUEST_TIMEOUT_MS,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: TEMPERATURE,
          // Retries are handled explicitly in this loop (bounded + backoff).
          maxRetries: 0,
          abortSignal: req.signal,
          // OpenRouter-native fallback before our own retry loop kicks in.
          providerOptions: openRouterFallbackOptions(),
        });

        const text = result.text;
        const parsed = parseGenerationResponse(text);

        if (parsed.success) {
          return Response.json({ generation: parsed.data, raw: text });
        }

        lastError = parsed.error;
        lastThrown = null;
        currentMessages = buildRetryMessages(currentMessages, lastError);
      } catch (err) {
        lastThrown = err;
        lastError = err instanceof Error ? err.message : "Unknown error";
        // Auth failures are fail-fast (never an overload; retrying is useless).
        // Non-transient errors won't heal on retry either.
        if (isAuthError(err) || !isRetryableProviderError(err)) break;
        // Otherwise the loop backs off and retries (bounded by MAX_RETRIES).
      }
    }

    if (lastThrown) {
      const payload = toProviderErrorPayload(lastThrown);
      console.error("[generate] failed:", payload.code ?? payload.status, payload.error);
      const error =
        payload.status === 500 && lastError
          ? `Generation failed after ${MAX_RETRIES + 1} attempts: ${lastError.slice(0, 300)}`
          : payload.error;
      return Response.json(
        payload.code ? { error, code: payload.code } : { error },
        { status: payload.status }
      );
    }

    return Response.json(
      { error: `Generation failed after ${MAX_RETRIES + 1} attempts: ${lastError}` },
      { status: 500 }
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
