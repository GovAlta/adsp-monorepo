export const STREAM_ERROR_CODES = {
  GENERATION_DEADLINE: 'GENERATION_DEADLINE',
  MAX_STEPS: 'MAX_STEPS',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

const RATE_LIMITED_PREFIX = 'The AI service is busy right now.';
const RATE_LIMITED_STATUS = 429;
const RATE_LIMITED_PATTERN = /\brate[\s_-]?limit|too many requests|\b(?:status(?:[\s_]?code)?|http)[\s:=]*429\b/i;
// Wrapped errors (retry, Mastra and cause chains) are only a few levels deep; the cap also guards against cycles.
const MAX_ERROR_NESTING = 5;

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
  if (typeof candidate.code === 'string' && candidate.code in STREAM_ERROR_CODES_LOOKUP) {
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

const STREAM_ERROR_CODES_LOOKUP: Record<string, true> = {
  GENERATION_DEADLINE: true,
  MAX_STEPS: true,
  RATE_LIMITED: true,
};

/** Tells the user the shared model key is busy, with how long to wait when that is known. */
export function rateLimitedMessage(retryAfterMs?: number): string {
  if (retryAfterMs === undefined) {
    return `${RATE_LIMITED_PREFIX} Please try again in a minute.`;
  }

  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return `${RATE_LIMITED_PREFIX} Please try again in about ${seconds} second${seconds === 1 ? '' : 's'}.`;
}

/**
 * Recognises a provider rate-limit failure: an AI SDK APICallError with status 429, also when wrapped by a RetryError
 * (lastError, errors) or as the cause of another error, or a message that says so.
 */
function isRateLimitError(error: unknown, depth = 0): boolean {
  if (depth > MAX_ERROR_NESTING) {
    return false;
  }
  if (typeof error === 'string') {
    return RATE_LIMITED_PATTERN.test(error);
  }
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    statusCode?: unknown;
    message?: unknown;
    lastError?: unknown;
    errors?: unknown;
    cause?: unknown;
  };
  if (candidate.statusCode === RATE_LIMITED_STATUS) {
    return true;
  }
  if (typeof candidate.message === 'string' && RATE_LIMITED_PATTERN.test(candidate.message)) {
    return true;
  }

  const wrapped = [candidate.lastError, candidate.cause, ...(Array.isArray(candidate.errors) ? candidate.errors : [])];
  return wrapped.some((nested) => nested !== undefined && isRateLimitError(nested, depth + 1));
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

  if (isRateLimitError(error)) {
    return { code: STREAM_ERROR_CODES.RATE_LIMITED, message: rateLimitedMessage() };
  }

  if (isAbortError(error)) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Form generation exceeded the time limit. Anything already saved is in the editor.';
    return { code: STREAM_ERROR_CODES.GENERATION_DEADLINE, message };
  }

  return null;
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
