/** Statuses at which the endpoint briefly could not take the call, so trying again can succeed. */
const RETRYABLE_STATUSES = new Set([502, 503]);
const CONNECTION_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);
export const RETRY_BASE_DELAY_MS = 1000;

function isConnectionError(error: unknown): boolean {
  const cause = (error as { cause?: { code?: unknown } })?.cause;
  return typeof cause?.code === 'string' && CONNECTION_ERROR_CODES.has(cause.code);
}

function wait(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Fetch for model calls that tries again, with a growing delay, when the connection fails or the endpoint answers 502
 * or 503. These fail before any reply, so a retry cannot repeat output. A rate limit (429) is not retried: it lasts
 * until the key's window resets, so the user is told to wait instead.
 */
export function createRetryingFetch(retries: number, baseDelayMs = RETRY_BASE_DELAY_MS): typeof fetch {
  return async (input, init) => {
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await globalThis.fetch(input, init);
        if (attempt >= retries || !RETRYABLE_STATUSES.has(response.status)) {
          return response;
        }
        await response.body?.cancel();
      } catch (error) {
        if (attempt >= retries || init?.signal?.aborted || !isConnectionError(error)) {
          throw error;
        }
      }
      await wait(baseDelayMs * 2 ** attempt, init?.signal);
    }
  };
}
