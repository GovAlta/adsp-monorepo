import { FileServiceError } from './fileServiceError';
import type { FileMetadata, FileServiceErrorReason, FileTypeInfo } from './types';

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
// See FileEntity.create in apps/file-service/src/file/model/file.ts.
const UNSUPPORTED_FORMAT_MESSAGE = /invalid file type extension/i;

export function toErrorReason(status: number, errorMessage?: string): FileServiceErrorReason {
  switch (status) {
    case 401:
      return 'unauthenticated';
    case 403:
      return 'forbidden';
    case 404:
      return 'not-found';
    case 400:
      if (errorMessage && SCAN_PENDING_MESSAGE.test(errorMessage)) {
        return 'scan-pending';
      }
      return errorMessage && UNSUPPORTED_FORMAT_MESSAGE.test(errorMessage) ? 'unsupported-format' : 'unavailable';
    default:
      return 'unexpected';
  }
}

export async function toResponseError(response: Response, operation: string): Promise<FileServiceError> {
  let body: string | undefined;
  try {
    body = await response.text();
  } catch {
    // An unreadable body is treated like an empty one.
  }

  return toStatusError(response.status, body, operation);
}

// Not every error response has a JSON body, for example the 500 from the error handler.
function getErrorMessage(body: string | undefined): string | undefined {
  try {
    return (body ? (JSON.parse(body) as { errorMessage?: string }) : undefined)?.errorMessage;
  } catch {
    return undefined;
  }
}

export function toStatusError(status: number, body: string | undefined, operation: string): FileServiceError {
  const errorMessage = getErrorMessage(body);
  return new FileServiceError(
    toErrorReason(status, errorMessage),
    `${operation} failed with status ${status}${errorMessage ? `: ${errorMessage}` : '.'}`,
    status,
  );
}

// The response of GET /file/v1/types/{fileTypeId}; see mapFileType in apps/file-service/src/file/mapper.ts.
export interface FileServiceFileType {
  id: string;
  name: string;
  anonymousRead?: boolean;
  allowedFileTypes?: string[];
}

export function mapFileType(type: FileServiceFileType): FileTypeInfo {
  return {
    id: type.id,
    name: type.name,
    anonymousRead: type.anonymousRead ?? false,
    allowedFileTypes: (type.allowedFileTypes ?? []).map((allowed) => allowed.trim()).filter((allowed) => !!allowed),
  };
}
