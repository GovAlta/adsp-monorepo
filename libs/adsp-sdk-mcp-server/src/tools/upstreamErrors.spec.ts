class MockHttpRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

class MockServiceNotInDirectoryError extends Error {}

jest.mock('@abgov/adsp-cli', () => ({
  HttpRequestError: MockHttpRequestError,
  ServiceNotInDirectoryError: MockServiceNotInDirectoryError,
}));

import { classifyUpstreamError } from './upstreamErrors';

describe('classifyUpstreamError', () => {
  it.each([
    ['a service missing from the directory', 'not_in_directory', new MockServiceNotInDirectoryError('missing')],
    ['an HTTP 500', 'http_5xx', new MockHttpRequestError(500, 'server error')],
    ['an HTTP 503', 'http_5xx', new MockHttpRequestError(503, 'unavailable')],
    ['an HTTP 499', 'http_4xx', new MockHttpRequestError(499, 'client closed')],
    ['an HTTP 401', 'http_4xx', new MockHttpRequestError(401, 'unauthorized')],
    ['a fetch connection failure', 'network', new TypeError('fetch failed')],
    ['any other error', 'other', new Error('unexpected')],
    ['a thrown non-error value', 'other', 'boom'],
  ])('classifies %s as %s', (_description, expected, error) => {
    expect(classifyUpstreamError(error)).toBe(expected);
  });
});
