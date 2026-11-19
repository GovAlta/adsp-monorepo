import axios from 'axios';
import type { DetailFailure } from './types';

export class SharePointError extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly retryable: boolean,
    public readonly column?: string,
    public readonly status?: number,
    public readonly retryAfterMs?: number,
  ) {
    super(`SharePoint request failed with: ${errorCode}`);
    Object.setPrototypeOf(this, SharePointError.prototype);
  }
}

export class CredentialNotSetError extends Error {
  constructor(public readonly connectionId: string) {
    super(`No credential is set for SharePoint connection '${connectionId}'.`);
    Object.setPrototypeOf(this, CredentialNotSetError.prototype);
  }
}

// Raised when the stored secret can't be decrypted, usually because CREDENTIALS_KEY changed.
export class CredentialUnreadableError extends Error {
  constructor(public readonly connectionId: string) {
    super(`The credential for SharePoint connection '${connectionId}' cannot be decrypted.`);
    Object.setPrototypeOf(this, CredentialUnreadableError.prototype);
  }
}

export class DestinationDisabledError extends Error {
  constructor(public readonly destinationId: string) {
    super(`SharePoint destination '${destinationId}' is disabled.`);
    Object.setPrototypeOf(this, DestinationDisabledError.prototype);
  }
}

export class DestinationNotSetUpError extends Error {
  constructor(public readonly destinationId: string) {
    super(`SharePoint destination '${destinationId}' has a detail list that is not set up yet.`);
    Object.setPrototypeOf(this, DestinationNotSetUpError.prototype);
  }
}

// The main row was written but some detail rows were not; a retry of the whole push corrects them.
export class DetailRowsFailedError extends SharePointError {
  constructor(
    public readonly dataId: string,
    public readonly detailFailures: DetailFailure[],
    errorCode: string,
    retryable: boolean,
  ) {
    super(errorCode, retryable);
    Object.setPrototypeOf(this, DetailRowsFailedError.prototype);
  }
}

// Only the column name is taken from Graph's message; the rest can echo submitted values.
const COLUMN_PATTERN = /Field '([^']+)'/;

function parseRetryAfter(value: unknown): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const date = Date.parse(String(value));
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

export function toSharePointError(err: unknown): SharePointError {
  if (err instanceof SharePointError) {
    return err;
  }
  if (!axios.isAxiosError(err)) {
    return new SharePointError('unknown', false);
  }
  if (!err.response) {
    return new SharePointError('network', true);
  }

  const { status, data, headers } = err.response;
  const retryable = status === 429 || status >= 500;
  const retryAfterMs = parseRetryAfter(headers?.['retry-after']);
  const body = data as { error?: unknown; error_codes?: number[] } | undefined;

  if (typeof body?.error === 'string') {
    const [aadsts] = body.error_codes ?? [];
    return new SharePointError(
      aadsts ? `entra:AADSTS${aadsts}` : `entra:${body.error}`,
      retryable,
      undefined,
      status,
      retryAfterMs,
    );
  }

  const graphError = body?.error as { code?: string; message?: string } | undefined;
  const column = graphError?.message ? COLUMN_PATTERN.exec(graphError.message)?.[1] : undefined;
  return new SharePointError(`graph:${graphError?.code ?? status}`, retryable, column, status, retryAfterMs);
}
