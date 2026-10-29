/**
 * OpenRouter provider-error classification.
 *
 * OpenRouter sometimes answers with HTTP 503 + `provider_overloaded`
 * (e.g. "Upstream error from Nvidia: Service temporarily overloaded").
 * That is a transient capacity problem — never an authentication problem —
 * so it must be retried with backoff and, when the provider stays down,
 * surfaced as a clean 503 instead of a 200 or a generic 500.
 *
 * Pure functions only (no secrets, no Node APIs) so this module is safe to
 * import from both Route Handlers and client components.
 */

/** Machine-readable code OpenRouter uses for overloaded providers. */
export const PROVIDER_OVERLOADED_CODE = "provider_overloaded";

/** User-facing message shown when the provider is temporarily busy. */
export const PROVIDER_BUSY_MESSAGE =
  "AI provider is temporarily busy. Please try again in a moment.";

/** HTTP statuses from OpenRouter that mean "try again shortly". */
const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 529]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Best-effort HTTP status extraction (AI SDK APICallError or fetch-style). */
export function getErrorStatusCode(err: unknown): number | null {
  if (!isRecord(err)) return null;
  const direct = (err as { statusCode?: unknown }).statusCode;
  if (typeof direct === "number") return direct;
  const status = (err as { status?: unknown }).status;
  if (typeof status === "number") return status;
  const cause = (err as { cause?: unknown }).cause;
  if (cause !== err && isRecord(cause)) return getErrorStatusCode(cause);
  return null;
}

function appendText(out: string[], value: unknown, depth: number): void {
  if (value == null || depth > 3) return;
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (typeof value === "number") {
    out.push(String(value));
    return;
  }
  if (isRecord(value)) {
    for (const key of ["message", "error", "code", "responseBody", "data", "cause"]) {
      if (key in value) appendText(out, value[key], depth + 1);
    }
    const metadata = value["metadata"];
    if (isRecord(metadata)) appendText(out, metadata, depth + 1);
  }
}

/** Combined searchable text for an error (message + status + body + cause). */
function errorText(err: unknown): string {
  const parts: string[] = [];
  appendText(parts, err, 0);
  return parts.join(" | ");
}

/** True for authentication/authorization failures — never retry these. */
export function isAuthError(err: unknown): boolean {
  const status = getErrorStatusCode(err);
  if (status === 401 || status === 403) return true;
  return /401|403|unauthorized|forbidden|invalid api key|invalid_api_key|authentication|api key (is )?(missing|not set)/i.test(
    errorText(err)
  );
}

/** True when the request was intentionally cancelled — never retry, never report. */
export function isAbortError(err: unknown): boolean {
  if (!isRecord(err)) return false;
  const name = (err as { name?: unknown }).name;
  if (name === "AbortError" || name === "Abort") return true;
  const code = (err as { code?: unknown }).code;
  if (code === "ABORT_ERR" || code === 20) return true;
  return /aborted|abortion|operation was aborted/i.test(errorText(err));
}

/**
 * True when OpenRouter reports an overloaded/unavailable upstream provider:
 * HTTP 503, `provider_overloaded`, or "temporarily overloaded" wording.
 * Auth errors are explicitly excluded.
 */
export function isProviderOverloadError(err: unknown): boolean {
  if (isAbortError(err) || isAuthError(err)) return false;
  if (getErrorStatusCode(err) === 503) return true;
  return /provider_overloaded|temporarily overloaded|service overloaded|upstream error|no available provider|provider is (temporarily )?unavailable/i.test(
    errorText(err)
  );
}

/**
 * True for transient provider failures worth retrying with backoff:
 * overload markers, transient HTTP statuses, SDK-flagged retryable errors,
 * and network/timeout blips. Auth errors and cancellations are excluded.
 */
export function isRetryableProviderError(err: unknown): boolean {
  if (isAbortError(err) || isAuthError(err)) return false;
  if (isProviderOverloadError(err)) return true;
  const status = getErrorStatusCode(err);
  if (status !== null && TRANSIENT_STATUS_CODES.has(status)) return true;
  if (isRecord(err) && (err as { isRetryable?: unknown }).isRetryable === true) return true;
  return /timeout|timed out|econnreset|econnrefused|socket hang up|fetch failed|network error|temporarily unavailable|try again/i.test(
    errorText(err)
  );
}

export interface ProviderErrorPayload {
  error: string;
  code?: string;
  status: number;
}

/**
 * Map a caught provider error to a clean JSON payload + HTTP status.
 * Never includes API keys or raw upstream bodies — only safe messages.
 */
export function toProviderErrorPayload(err: unknown, fallbackDetail = ""): ProviderErrorPayload {
  if (isProviderOverloadError(err)) {
    return {
      error: "AI provider is temporarily overloaded. Please try again.",
      code: PROVIDER_OVERLOADED_CODE,
      status: 503,
    };
  }
  const status = getErrorStatusCode(err);
  if (status === 429) {
    return {
      error: "AI rate limit reached. Please wait a moment and try again.",
      code: "rate_limited",
      status: 429,
    };
  }
  if (status === 502 || status === 529) {
    return {
      error: "AI provider is temporarily unavailable. Please try again.",
      code: "provider_unavailable",
      status: 502,
    };
  }
  const detail =
    err instanceof Error && err.message
      ? err.message.slice(0, 300)
      : fallbackDetail.slice(0, 300);
  return {
    error: detail ? `Generation failed: ${detail}` : "Generation failed. Please try again.",
    status: 500,
  };
}

/**
 * Detect an overload from a server error payload (parsed JSON body or raw
 * text) as seen by the browser client.
 */
export function isOverloadedResponse(status: number, rawBody: string): boolean {
  if (status === 503) return true;
  return /provider_overloaded|temporarily overloaded|temporarily busy|service overloaded|upstream error/i.test(
    rawBody
  );
}
