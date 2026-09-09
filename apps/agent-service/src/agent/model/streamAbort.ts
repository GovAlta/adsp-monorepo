export const STREAM_ERROR_CODES = {
  GENERATION_DEADLINE: 'GENERATION_DEADLINE',
  MAX_STEPS: 'MAX_STEPS',
} as const;

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

function readStreamError(value: unknown): { code: StreamErrorCode; message: string } | null {
  if (!value || typeof value !== 'object') {
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
    return readStreamError(candidate.cause);
  }

  return null;
}

const STREAM_ERROR_CODES_LOOKUP: Record<string, true> = {
  GENERATION_DEADLINE: true,
  MAX_STEPS: true,
};

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
