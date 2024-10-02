import { ExponentialBackoff, handleAll, retry as retryBuilder } from 'cockatiel';

export const retry = retryBuilder(handleAll, { maxAttempts: 10, backoff: new ExponentialBackoff() });
