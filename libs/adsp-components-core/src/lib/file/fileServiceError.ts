import type { FileServiceErrorReason } from './types';

const RETRYABLE_REASONS: readonly FileServiceErrorReason[] = ['scan-pending', 'unexpected'];

export class FileServiceError extends Error {
  readonly reason: FileServiceErrorReason;
  /** HTTP status of the File service response; undefined when no response was received. */
  readonly status?: number;

  constructor(reason: FileServiceErrorReason, message: string, status?: number) {
    super(message);
    this.name = 'FileServiceError';
    this.reason = reason;
    this.status = status;
    Object.setPrototypeOf(this, FileServiceError.prototype);
  }

  /** Whether trying the same request again can succeed. */
  get retryable(): boolean {
    return RETRYABLE_REASONS.includes(this.reason);
  }
}

// Anything thrown that isn't already a FileServiceError, such as a network failure, is unexpected.
export function toFileServiceError(err: unknown): FileServiceError {
  if (err instanceof FileServiceError) {
    return err;
  }

  const message = err instanceof Error ? err.message : String(err);
  return new FileServiceError('unexpected', message);
}

// The reason a downloadable file's metadata already rules out a download, so a component can say so before a click.
export function getFileUnavailableReason(file: {
  scanned: boolean;
  infected: boolean;
}): FileServiceErrorReason | undefined {
  if (file.infected) {
    return 'unavailable';
  }

  if (!file.scanned) {
    return 'scan-pending';
  }

  return undefined;
}
