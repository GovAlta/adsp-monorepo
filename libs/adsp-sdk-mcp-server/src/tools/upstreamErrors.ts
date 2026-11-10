import { HttpRequestError, ServiceNotInDirectoryError } from '@abgov/adsp-cli';
import type { UpstreamErrorType } from '../metrics';

export function classifyUpstreamError(err: unknown): UpstreamErrorType {
  if (err instanceof ServiceNotInDirectoryError) {
    return 'not_in_directory';
  }
  if (err instanceof HttpRequestError) {
    return err.status >= 500 ? 'http_5xx' : 'http_4xx';
  }
  // fetch reports connection failures (refused, DNS, TLS) as TypeError.
  if (err instanceof TypeError) {
    return 'network';
  }
  return 'other';
}
