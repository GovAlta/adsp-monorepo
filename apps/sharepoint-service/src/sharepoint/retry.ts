import { AsyncLocalStorage } from 'async_hooks';
import { Logger } from 'winston';
import { SharePointError, toSharePointError } from './errors';

export const MAX_RETRIES = 3;
export const BASE_DELAY_MS = 1000;
export const RETRY_WAIT_BUDGET_MS = 20000;
// Keeps a whole request, including its retries, inside the 60 second route timeout.
export const RETRY_DEADLINE_MS = 40000;

const TRANSIENT_STATUSES = [429, 503, 504];
const REFUSED_STATUSES = [429, 503];

interface RetryScope {
  logger?: Logger;
  logContext?: Record<string, unknown>;
  startedAt: number;
  waitedMs: number;
}

interface RetryStore {
  scope: RetryScope;
  inRetry: boolean;
}

const retryStore = new AsyncLocalStorage<RetryStore>();

const newScope = (logger?: Logger, logContext?: Record<string, unknown>): RetryScope => ({
  logger,
  logContext,
  startedAt: Date.now(),
  waitedMs: 0,
});

// All retries made while handling one request share this scope, and so share one waiting budget.
export function withRetryScope<T>(
  logger: Logger,
  logContext: Record<string, unknown>,
  operation: () => Promise<T>,
): Promise<T> {
  if (retryStore.getStore()) {
    return operation();
  }
  return retryStore.run({ scope: newScope(logger, logContext), inRetry: false }, operation);
}

// Throttling, brief outages and gateway timeouts. Other 4xx errors need a configuration change instead.
export const isTransient = (err: unknown): boolean =>
  err instanceof SharePointError &&
  (err.errorCode === 'network' || (err.status !== undefined && TRANSIENT_STATUSES.includes(err.status)));

// The request was refused, so nothing was written and even a create is safe to repeat.
export const isRefused = (err: unknown): boolean =>
  err instanceof SharePointError && err.status !== undefined && REFUSED_STATUSES.includes(err.status);

const backoffMs = (retry: number): number => BASE_DELAY_MS * 2 ** (retry - 1) * (0.75 + Math.random() * 0.5);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Only the outermost call retries, so a retried operation never multiplies the attempts of the calls inside it.
export async function withRetry<T>(operation: () => Promise<T>, shouldRetry: (err: unknown) => boolean): Promise<T> {
  const store = retryStore.getStore();
  if (store?.inRetry) {
    return operation();
  }

  const scope = store?.scope ?? newScope();
  for (let attempt = 1; ; attempt++) {
    try {
      return await retryStore.run({ scope, inRetry: true }, operation);
    } catch (err) {
      if (attempt > MAX_RETRIES || !shouldRetry(err)) {
        throw err;
      }

      const delay =
        err instanceof SharePointError && err.retryAfterMs !== undefined ? err.retryAfterMs : backoffMs(attempt);
      if (scope.waitedMs + delay > RETRY_WAIT_BUDGET_MS || Date.now() - scope.startedAt + delay > RETRY_DEADLINE_MS) {
        throw err;
      }

      scope.waitedMs += delay;
      scope.logger?.warn(
        `Retrying SharePoint request (retry ${attempt} of ${MAX_RETRIES}) after: ${
          err instanceof SharePointError ? err.errorCode : 'unknown'
        }.`,
        scope.logContext,
      );
      await sleep(delay);
    }
  }
}

export function requestWithRetry<T>(request: () => Promise<T>): Promise<T> {
  return withRetry(async () => {
    try {
      return await request();
    } catch (err) {
      throw toSharePointError(err);
    }
  }, isTransient);
}
