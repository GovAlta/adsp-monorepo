import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Logger } from 'winston';
import { SharePointError } from './errors';
import {
  isRefused,
  isTransient,
  RETRY_DEADLINE_MS,
  RETRY_WAIT_BUDGET_MS,
  requestWithRetry,
  withRetry,
  withRetryScope,
} from './retry';

const axiosError = (status: number | undefined, headers: Record<string, string> = {}) => {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response = status
    ? ({ status, data: { error: { code: 'serviceNotAvailable' } }, statusText: '', headers, config } as AxiosResponse)
    : undefined;
  return new AxiosError('request failed', 'ERR', config, {}, response);
};

const unavailable = (retryAfterMs?: number) =>
  new SharePointError('graph:serviceNotAvailable', true, undefined, 503, retryAfterMs);

describe('retry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const settle = async <T>(promise: Promise<T>) => {
    const settled = promise.then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    await jest.runAllTimersAsync();
    return settled;
  };

  const failing = (errors: unknown[], attemptTimes: number[] = []) => {
    const start = Date.now();
    let calls = 0;
    const operation = jest.fn(async () => {
      attemptTimes.push(Date.now() - start);
      const error = errors[calls++];
      if (error) {
        throw error;
      }
      return 'done';
    });
    return operation;
  };

  describe('predicates', () => {
    it('treats 429, 503, 504 and network errors as transient', () => {
      expect(isTransient(new SharePointError('graph:TooManyRequests', true, undefined, 429))).toBe(true);
      expect(isTransient(unavailable())).toBe(true);
      expect(isTransient(new SharePointError('graph:gatewayTimeout', true, undefined, 504))).toBe(true);
      expect(isTransient(new SharePointError('network', true))).toBe(true);
    });

    it('does not treat other errors as transient', () => {
      expect(isTransient(new SharePointError('graph:generalException', true, undefined, 500))).toBe(false);
      expect(isTransient(new SharePointError('graph:accessDenied', false, undefined, 403))).toBe(false);
      expect(isTransient(new SharePointError('entra:AADSTS7000222', false, undefined, 401))).toBe(false);
      expect(isTransient(new SharePointError('file:unavailable', true))).toBe(false);
      expect(isTransient(new Error('x'))).toBe(false);
    });

    it('treats only 429 and 503 as a refused request', () => {
      expect(isRefused(new SharePointError('graph:TooManyRequests', true, undefined, 429))).toBe(true);
      expect(isRefused(unavailable())).toBe(true);
      expect(isRefused(new SharePointError('graph:gatewayTimeout', true, undefined, 504))).toBe(false);
      expect(isRefused(new SharePointError('network', true))).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('returns without waiting when the first attempt succeeds', async () => {
      const operation = failing([]);

      expect(await settle(withRetry(operation, isTransient))).toEqual({ value: 'done' });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries with exponential backoff until the operation succeeds', async () => {
      const times: number[] = [];
      const operation = failing([unavailable(), unavailable()], times);

      expect(await settle(withRetry(operation, isTransient))).toEqual({ value: 'done' });
      expect(times).toEqual([0, 1000, 3000]);
    });

    it('adds jitter to the backoff', async () => {
      (Math.random as jest.Mock).mockReturnValue(1);
      const times: number[] = [];

      await settle(withRetry(failing([unavailable()], times), isTransient));
      expect(times).toEqual([0, 1250]);
    });

    it('stops after three retries and throws the last error', async () => {
      const times: number[] = [];
      const error = unavailable();
      const operation = failing([error, error, error, error, error], times);

      expect(await settle(withRetry(operation, isTransient))).toEqual({ error });
      expect(operation).toHaveBeenCalledTimes(4);
      expect(times).toEqual([0, 1000, 3000, 7000]);
    });

    it('waits for Retry-After instead of the backoff', async () => {
      const times: number[] = [];
      const operation = failing([unavailable(2000)], times);

      expect(await settle(withRetry(operation, isTransient))).toEqual({ value: 'done' });
      expect(times).toEqual([0, 2000]);
    });

    it('gives up at once when Retry-After is longer than the retry budget', async () => {
      const error = unavailable(RETRY_WAIT_BUDGET_MS + 1);
      const operation = failing([error]);

      expect(await settle(withRetry(operation, isTransient))).toEqual({ error });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('stops retrying when the next wait would exceed the retry budget', async () => {
      const error = unavailable(8000);
      const operation = failing([error, error, error, error]);

      expect(await settle(withRetry(operation, isTransient))).toEqual({ error });
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('stops retrying once the request deadline is too close', async () => {
      const error = unavailable();
      const operation = jest.fn(async () => {
        jest.setSystemTime(Date.now() + RETRY_DEADLINE_MS - 500);
        throw error;
      });

      expect(await settle(withRetry(operation, isTransient))).toEqual({ error });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('does not retry errors the predicate rejects', async () => {
      const error = new SharePointError('graph:accessDenied', false, undefined, 403);
      const operation = failing([error]);

      expect(await settle(withRetry(operation, isTransient))).toEqual({ error });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('does not retry an ambiguous failure when only refusals are retried', async () => {
      const error = new SharePointError('network', true);
      const operation = failing([error]);

      expect(await settle(withRetry(operation, isRefused))).toEqual({ error });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('leaves retrying to the outermost call', async () => {
      const inner = jest.fn(async () => {
        throw unavailable();
      });
      const outer = () => withRetry(inner, isTransient);

      await settle(withRetry(outer, isTransient));
      expect(inner).toHaveBeenCalledTimes(4);
    });
  });

  describe('withRetryScope', () => {
    const logger = { warn: jest.fn() } as unknown as Logger;
    const context = { context: 'SharePointRouter', tenant: 'tenant-1' };

    beforeEach(() => {
      (logger.warn as jest.Mock).mockReset();
    });

    it('shares the retry budget between the calls of one request', async () => {
      const slow = unavailable(12000);
      const first = failing([slow]);
      const second = failing([slow]);

      const result = await settle(
        withRetryScope(logger, context, async () => {
          await withRetry(first, isTransient);
          return withRetry(second, isTransient);
        }),
      );

      expect(result).toEqual({ error: slow });
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('gives each request its own budget', async () => {
      const slow = unavailable(12000);

      await settle(withRetryScope(logger, context, () => withRetry(failing([slow]), isTransient)));
      const second = failing([slow]);
      await settle(withRetryScope(logger, context, () => withRetry(second, isTransient)));

      expect(second).toHaveBeenCalledTimes(2);
    });

    it('logs each retry with the attempt and error code only', async () => {
      const error = new SharePointError('graph:serviceNotAvailable', true, undefined, 503);
      const operation = failing([error, error]);

      await settle(withRetryScope(logger, context, () => withRetry(operation, isTransient)));

      expect(logger.warn).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenNthCalledWith(
        1,
        'Retrying SharePoint request (retry 1 of 3) after: graph:serviceNotAvailable.',
        context,
      );
      expect(logger.warn).toHaveBeenNthCalledWith(
        2,
        'Retrying SharePoint request (retry 2 of 3) after: graph:serviceNotAvailable.',
        context,
      );
    });
  });

  describe('requestWithRetry', () => {
    it('retries a request that fails with 503 and returns its result', async () => {
      const times: number[] = [];
      const request = failing([axiosError(503)], times);

      expect(await settle(requestWithRetry(request))).toEqual({ value: 'done' });
      expect(times).toEqual([0, 1000]);
    });

    it('waits for the Retry-After header of a throttled request', async () => {
      const times: number[] = [];
      const request = failing([axiosError(429, { 'retry-after': '2' })], times);

      expect(await settle(requestWithRetry(request))).toEqual({ value: 'done' });
      expect(times).toEqual([0, 2000]);
    });

    it('retries a request that never got a response', async () => {
      const request = failing([axiosError(undefined)]);

      expect(await settle(requestWithRetry(request))).toEqual({ value: 'done' });
      expect(request).toHaveBeenCalledTimes(2);
    });

    it('throws a SharePoint error without retrying a request Graph rejected', async () => {
      const request = failing([axiosError(403)]);

      const result = await settle(requestWithRetry(request));
      expect(result).toEqual({ error: expect.objectContaining({ status: 403, retryable: false }) });
      expect(request).toHaveBeenCalledTimes(1);
    });
  });
});
