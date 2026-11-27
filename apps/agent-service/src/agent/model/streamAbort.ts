export const STREAM_ERROR_CODES = {
  GENERATION_DEADLINE: 'GENERATION_DEADLINE',
  MAX_STEPS: 'MAX_STEPS',
  RATE_LIMITED: 'RATE_LIMITED',
  MODEL_ERROR: 'MODEL_ERROR',
} as const;

const RATE_LIMITED_PREFIX = 'The AI service is busy right now.';
const RATE_LIMITED_STATUS = 429;
const RATE_LIMITED_PATTERN = /\brate[\s_-]?limit|too many requests|\b(?:status(?:[\s_]?code)?|http)[\s:=]*429\b/i;
// Wrapped errors (retry, Mastra and cause chains) are only a few levels deep; the cap also guards against cycles.
const MAX_ERROR_NESTING = 5;
// The AI SDK marks its errors with global symbols, so they are found whichever copy of the SDK threw: an endpoint's
// error status or no answer at all (APICallError), and a reply it could not read (TypeValidationError, JSONParseError).
const PROVIDER_ERROR_MARKERS = ['AI_APICallError', 'AI_TypeValidationError', 'AI_JSONParseError'].map((name) =>
  Symbol.for(`vercel.ai.error.${name}`),
);
// An error an OpenAI-compatible endpoint sends inside a stream reaches us as its parsed body, with only these keys.
const STREAMED_ERROR_BODY_KEYS = new Set(['message', 'type', 'param', 'code']);
// Statuses at which the endpoint read the request and refused it as sent, such as a conversation too long for the model.
const REJECTED_REQUEST_STATUSES = new Set([400, 413, 422]);
export const MODEL_UNAVAILABLE_MESSAGE = "The AI service isn't responding right now. Please try again in a moment.";
export const MODEL_REJECTED_MESSAGE =
  "The AI service couldn't answer this message. Start a new chat if this one is long; if it keeps happening, contact your administrator.";

export type StreamErrorCode = (typeof STREAM_ERROR_CODES)[keyof typeof STREAM_ERROR_CODES];

export class AgentStreamAbortError extends Error {
  readonly code: StreamErrorCode;

  constructor(code: StreamErrorCode, message: string) {
    super(message);
    this.name = 'AbortError';
    this.code = code;
  }
}

export function abortExecution(controller: AbortController, code: StreamErrorCode, message: string): void {
  if (controller.signal.aborted) {
    return;
  }
  controller.abort(new AgentStreamAbortError(code, message));
}

function readStreamError(value: unknown, depth = 0): { code: StreamErrorCode; message: string } | null {
  if (!value || typeof value !== 'object' || depth > MAX_ERROR_NESTING) {
    return null;
  }

  const candidate = value as { code?: unknown; message?: unknown; cause?: unknown };
  if (typeof candidate.code === 'string' && STREAM_ERROR_CODE_VALUES.has(candidate.code)) {
    return {
      code: candidate.code as StreamErrorCode,
      message: typeof candidate.message === 'string' ? candidate.message : 'Agent stream stopped.',
    };
  }

  if (candidate.cause) {
    return readStreamError(candidate.cause, depth + 1);
  }

  return null;
}

const STREAM_ERROR_CODE_VALUES = new Set<string>(Object.values(STREAM_ERROR_CODES));

/** Tells the user the shared model key is busy, with how long to wait when that is known. */
export function rateLimitedMessage(retryAfterMs?: number): string {
  if (retryAfterMs === undefined) {
    return `${RATE_LIMITED_PREFIX} Please try again in a minute.`;
  }

  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return `${RATE_LIMITED_PREFIX} Please try again in about ${seconds} second${seconds === 1 ? '' : 's'}.`;
}

interface ProviderErrorCandidate {
  statusCode?: unknown;
  message?: unknown;
  responseHeaders?: unknown;
  lastError?: unknown;
  errors?: unknown;
  cause?: unknown;
}

function nestedErrors(candidate: ProviderErrorCandidate): unknown[] {
  return [candidate.lastError, candidate.cause, ...(Array.isArray(candidate.errors) ? candidate.errors : [])].filter(
    (nested) => nested !== undefined,
  );
}

/** Applies a test to an error and to the errors it wraps: a RetryError's lastError and errors, and causes. */
function findInErrorChain<T>(error: unknown, match: (value: unknown) => T | undefined, depth = 0): T | undefined {
  if (depth > MAX_ERROR_NESTING) {
    return undefined;
  }

  const found = match(error);
  if (found !== undefined || !error || typeof error !== 'object') {
    return found;
  }

  for (const nested of nestedErrors(error as ProviderErrorCandidate)) {
    const nestedFound = findInErrorChain(nested, match, depth + 1);
    if (nestedFound !== undefined) {
      return nestedFound;
    }
  }
  return undefined;
}

/** A provider rate-limit failure: an AI SDK APICallError with status 429, or a message that says so. */
function matchRateLimit(value: unknown): ProviderErrorCandidate | string | undefined {
  if (typeof value === 'string') {
    return RATE_LIMITED_PATTERN.test(value) ? value : undefined;
  }
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as ProviderErrorCandidate;
  const limited =
    candidate.statusCode === RATE_LIMITED_STATUS ||
    (typeof candidate.message === 'string' && RATE_LIMITED_PATTERN.test(candidate.message));
  return limited ? candidate : undefined;
}

/** How long the provider says to wait, from x-bifrost-retry-after-ms, retry-after-ms or retry-after. */
function readRetryAfterMs(error: ProviderErrorCandidate | string): number | undefined {
  const headers = typeof error === 'object' ? error.responseHeaders : undefined;
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }

  const values = headers as Record<string, unknown>;
  const ms = Number(values['x-bifrost-retry-after-ms'] ?? values['retry-after-ms']);
  if (Number.isFinite(ms) && ms > 0) {
    return ms;
  }
  const seconds = Number(values['retry-after']);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined;
}

const LIMIT_WINDOW_PATTERN = /resets every (\d+)\s*([smhd])\b/i;
const LIMIT_WINDOW_UNITS: Record<string, string> = { s: 'second', m: 'minute', h: 'hour', d: 'day' };

/**
 * MaaS (Bifrost) sends no retry time with a token limit, only the key's window in its message, such as "token limit
 * exceeded (12681/10000, resets every 5m)". The window is the longest the user can have to wait.
 */
function readLimitWindow(error: ProviderErrorCandidate | string): string | undefined {
  const message = typeof error === 'string' ? error : typeof error.message === 'string' ? error.message : '';
  const match = LIMIT_WINDOW_PATTERN.exec(message);
  if (!match) {
    return undefined;
  }

  const count = Number(match[1]);
  const unit = LIMIT_WINDOW_UNITS[match[2].toLowerCase()];
  return count === 1 ? `${unit === 'hour' ? 'an' : 'a'} ${unit}` : `${count} ${unit}s`;
}

function providerRateLimitedMessage(error: ProviderErrorCandidate | string): string {
  const retryAfterMs = readRetryAfterMs(error);
  if (retryAfterMs !== undefined) {
    return rateLimitedMessage(retryAfterMs);
  }

  const window = readLimitWindow(error);
  return window ? `${RATE_LIMITED_PREFIX} Please try again within ${window}.` : rateLimitedMessage();
}

/**
 * An error from the model endpoint: an AI SDK error for an error status, no answer or an unreadable reply, or the error
 * body the endpoint sent inside a stream.
 */
function matchProviderError(value: unknown): ProviderErrorCandidate | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const marked = PROVIDER_ERROR_MARKERS.some((marker) => (value as Record<symbol, unknown>)[marker] === true);
  return marked || isStreamedErrorBody(value) ? (value as ProviderErrorCandidate) : undefined;
}

function isStreamedErrorBody(value: object): boolean {
  const keys = Object.keys(value);
  return (
    Object.getPrototypeOf(value) === Object.prototype &&
    typeof (value as { message?: unknown }).message === 'string' &&
    keys.every((key) => STREAMED_ERROR_BODY_KEYS.has(key))
  );
}

/**
 * The provider's own message is never shown: it can name the key, its owner or the provider's internals, and it is
 * written for developers. A 400, 413 or 422 means this message cannot succeed as sent; anything else, including a key
 * the endpoint refuses or no answer at all, means the service is unavailable for now.
 */
function providerErrorMessage(error: ProviderErrorCandidate): string {
  return typeof error.statusCode === 'number' && REJECTED_REQUEST_STATUSES.has(error.statusCode)
    ? MODEL_REJECTED_MESSAGE
    : MODEL_UNAVAILABLE_MESSAGE;
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const name = (error as { name?: string }).name;
  return name === 'AbortError' || name === 'TimeoutError';
}

export function mapAgentStreamError(error: unknown): { code: StreamErrorCode; message: string } | null {
  const mapped = readStreamError(error);
  if (mapped) {
    return mapped;
  }

  const rateLimitError = findInErrorChain(error, matchRateLimit);
  if (rateLimitError) {
    return { code: STREAM_ERROR_CODES.RATE_LIMITED, message: providerRateLimitedMessage(rateLimitError) };
  }

  if (isAbortError(error)) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Form generation exceeded the time limit. Anything already saved is in the editor.';
    return { code: STREAM_ERROR_CODES.GENERATION_DEADLINE, message };
  }

  const providerError = findInErrorChain(error, matchProviderError);
  if (providerError) {
    return { code: STREAM_ERROR_CODES.MODEL_ERROR, message: providerErrorMessage(providerError) };
  }

  return null;
}

/**
 * The plain message for a failure of the model endpoint, or undefined for any other error. For tools that call the
 * model and for sub-agents, whose errors would otherwise carry the endpoint's own message.
 */
export function describeModelFailure(error: unknown): string | undefined {
  return findInErrorChain(error, matchProviderError) ? mapAgentStreamError(error)?.message : undefined;
}

/** A tool-error chunk whose error came from the model endpoint carries the plain message instead. */
export function toToolErrorPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) {
    return payload;
  }

  const message = describeModelFailure((payload as { error: unknown }).error);
  return message ? { ...payload, error: message } : payload;
}

export function describeStreamError(error: unknown): string {
  if (typeof error === 'string' && error) {
    return error;
  }

  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; error?: unknown; cause?: unknown };
    if (typeof candidate.message === 'string' && candidate.message) {
      return candidate.message;
    }
    for (const nested of [candidate.error, candidate.cause]) {
      if (nested !== undefined && nested !== null) {
        return describeStreamError(nested);
      }
    }
  }

  return 'The agent stopped unexpectedly. Anything already saved is in the editor.';
}

/**
 * Mastra emits `{ type: 'error', payload: { error } }`, which carries no message the client can render.
 */
export function toStreamErrorPayload(payload: unknown): { code?: StreamErrorCode; message: string } {
  const error =
    payload && typeof payload === 'object' && 'error' in payload ? (payload as { error: unknown }).error : payload;
  return mapAgentStreamError(error) ?? { message: describeStreamError(error) };
}

export function toStreamTripwirePayload(payload: unknown): { message: string; details?: unknown } {
  if (payload && typeof payload === 'object') {
    const candidate = payload as { reason?: unknown; retry?: unknown; metadata?: unknown; processorId?: unknown };
    if (typeof candidate.reason === 'string' && candidate.reason) {
      return {
        message: candidate.reason,
        details: {
          ...(typeof candidate.processorId === 'string' ? { processorId: candidate.processorId } : {}),
          ...(typeof candidate.retry === 'boolean' ? { retry: candidate.retry } : {}),
          ...(candidate.metadata !== undefined ? { metadata: candidate.metadata } : {}),
        },
      };
    }
  }

  return { message: describeStreamError(payload) };
}
