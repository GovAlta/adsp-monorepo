import { Results } from '@core-services/core-common';
import { ExponentialBackoff, handleAll, retry as retryBuilder } from 'cockatiel';

export function isPaged(data: unknown): data is Pick<Results<unknown>, 'page'> {
  return (
    typeof data === 'object' &&
    typeof (data as Results<unknown>)?.page === 'object'
  );
}

export const retry = retryBuilder(handleAll, { maxAttempts: 2, backoff: new ExponentialBackoff() });
