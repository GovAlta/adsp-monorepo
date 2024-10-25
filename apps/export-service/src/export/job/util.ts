import { Results } from '@core-services/core-common';
import { ExponentialBackoff, handleAll, retry as retryBuilder } from 'cockatiel';

export function isPagedResults(data: unknown): data is Results<unknown> {
  return (
    typeof data === 'object' &&
    Array.isArray((data as Results<unknown>)?.results) &&
    typeof (data as Results<unknown>)?.page === 'object'
  );
}

export const retry = retryBuilder(handleAll, { maxAttempts: 2, backoff: new ExponentialBackoff() });
