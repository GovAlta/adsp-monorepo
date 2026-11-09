import { FileServiceError } from './fileServiceError';
import type { FileMetadata, FileServiceErrorReason } from './types';

// The response of GET /file/v1/files/{fileId}; see mapFile in apps/file-service/src/file/mapper.ts.
export interface FileServiceFile {
  id: string;
  urn: string;
  filename: string;
  size: number;
  mimeType?: string;
  typeName?: string;
  recordId?: string;
  created?: string;
  scanned?: boolean;
  infected?: boolean;
}

export function mapFile(file: FileServiceFile): FileMetadata {
  return {
    id: file.id,
    urn: file.urn,
    filename: file.filename,
    size: file.size,
    mimeType: file.mimeType,
    typeName: file.typeName,
    recordId: file.recordId,
    created: file.created ? new Date(file.created) : undefined,
    scanned: file.scanned ?? false,
    infected: file.infected ?? false,
  };
}

// File service sends `attachment; filename*=UTF-8''<RFC 5987 encoded name>`; plain `filename="..."` is the fallback.
export function getContentDispositionFilename(header: string | null): string | undefined {
  if (!header) {
    return undefined;
  }

  const extended = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(header);
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      // A malformed encoding falls through to the plain filename parameter.
    }
  }

  const plain = /filename\s*=\s*"([^"]*)"|filename\s*=\s*([^;]+)/.exec(header);
  const value = plain?.[1] ?? plain?.[2]?.trim();
  return value || undefined;
}

// File service answers a 400 for several conditions and only the message tells them apart.
const SCAN_PENDING_MESSAGE = /scan pending/i;

export function toErrorReason(status: number, errorMessage?: string): FileServiceErrorReason {
  switch (status) {
    case 401:
      return 'unauthenticated';
    case 403:
      return 'forbidden';
    case 404:
      return 'not-found';
    case 400:
      return errorMessage && SCAN_PENDING_MESSAGE.test(errorMessage) ? 'scan-pending' : 'unavailable';
    default:
      return 'unexpected';
  }
}

export async function toResponseError(response: Response, operation: string): Promise<FileServiceError> {
  let errorMessage: string | undefined;
  try {
    const body = (await response.json()) as { errorMessage?: string };
    errorMessage = body?.errorMessage;
  } catch {
    // Not every error response has a JSON body, for example the 500 from the error handler.
  }

  return new FileServiceError(
    toErrorReason(response.status, errorMessage),
    `${operation} failed with status ${response.status}${errorMessage ? `: ${errorMessage}` : '.'}`,
    response.status,
  );
}
