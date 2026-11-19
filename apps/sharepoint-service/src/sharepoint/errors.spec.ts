import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { SharePointError, toSharePointError } from './errors';

const axiosError = (status: number | undefined, data?: unknown) => {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response = status ? ({ status, data, statusText: '', headers: {}, config } as AxiosResponse) : undefined;
  return new AxiosError('request failed', 'ERR', config, {}, response);
};

describe('toSharePointError', () => {
  it('maps Entra errors to the AADSTS code and is not retryable', () => {
    const err = toSharePointError(
      axiosError(401, { error: 'invalid_client', error_codes: [7000215], error_description: 'secret' }),
    );
    expect(err).toEqual(expect.objectContaining({ errorCode: 'entra:AADSTS7000215', retryable: false }));
    expect(err.message).not.toContain('secret');
  });

  it('maps Graph errors to their code and extracts the column name only', () => {
    const err = toSharePointError(
      axiosError(400, { error: { code: 'invalidRequest', message: "Field 'Nope' is not recognized" } }),
    );
    expect(err).toEqual(
      expect.objectContaining({ errorCode: 'graph:invalidRequest', retryable: false, column: 'Nope' }),
    );
  });

  it('marks throttling and server errors as retryable', () => {
    expect(toSharePointError(axiosError(429, { error: { code: 'TooManyRequests' } })).retryable).toBe(true);
    expect(toSharePointError(axiosError(503, { error: { code: 'serviceNotAvailable' } })).retryable).toBe(true);
  });

  it('marks network failures as retryable', () => {
    expect(toSharePointError(axiosError(undefined))).toEqual(
      expect.objectContaining({ errorCode: 'network', retryable: true }),
    );
  });

  it('passes SharePoint errors through and maps anything else to unknown', () => {
    const existing = new SharePointError('graph:accessDenied', false);
    expect(toSharePointError(existing)).toBe(existing);
    expect(toSharePointError(new Error('x'))).toEqual(
      expect.objectContaining({ errorCode: 'unknown', retryable: false }),
    );
  });

  it('keeps the HTTP status of the response', () => {
    expect(toSharePointError(axiosError(503, { error: { code: 'serviceNotAvailable' } })).status).toBe(503);
    expect(toSharePointError(axiosError(401, { error: 'invalid_client', error_codes: [7000215] })).status).toBe(401);
    expect(toSharePointError(axiosError(undefined)).status).toBeUndefined();
  });

  describe('Retry-After', () => {
    const throttled = (retryAfter: string | undefined) => {
      const config = { headers: {} } as InternalAxiosRequestConfig;
      const response = {
        status: 429,
        data: { error: { code: 'TooManyRequests' } },
        statusText: '',
        headers: retryAfter === undefined ? {} : { 'retry-after': retryAfter },
        config,
      } as AxiosResponse;
      return toSharePointError(new AxiosError('request failed', 'ERR', config, {}, response));
    };

    it('reads a number of seconds', () => {
      expect(throttled('2').retryAfterMs).toBe(2000);
    });

    it('reads an HTTP date', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-11-18T10:00:00Z'));
      expect(throttled('Wed, 18 Nov 2026 10:00:05 GMT').retryAfterMs).toBe(5000);
      jest.useRealTimers();
    });

    it('ignores a missing or invalid value', () => {
      expect(throttled(undefined).retryAfterMs).toBeUndefined();
      expect(throttled('soon').retryAfterMs).toBeUndefined();
    });
  });
});
