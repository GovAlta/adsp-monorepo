import axios from 'axios';

export class SharePointError extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly retryable: boolean,
    public readonly column?: string,
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

export class DestinationDisabledError extends Error {
  constructor(public readonly destinationId: string) {
    super(`SharePoint destination '${destinationId}' is disabled.`);
    Object.setPrototypeOf(this, DestinationDisabledError.prototype);
  }
}

// Only the column name is taken from Graph's message; the rest can echo submitted values.
const COLUMN_PATTERN = /Field '([^']+)'/;

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

  const { status, data } = err.response;
  const retryable = status === 429 || status >= 500;
  const body = data as { error?: unknown; error_codes?: number[] } | undefined;

  if (typeof body?.error === 'string') {
    const [aadsts] = body.error_codes ?? [];
    return new SharePointError(aadsts ? `entra:AADSTS${aadsts}` : `entra:${body.error}`, retryable);
  }

  const graphError = body?.error as { code?: string; message?: string } | undefined;
  const column = graphError?.message ? COLUMN_PATTERN.exec(graphError.message)?.[1] : undefined;
  return new SharePointError(`graph:${graphError?.code ?? status}`, retryable, column);
}
