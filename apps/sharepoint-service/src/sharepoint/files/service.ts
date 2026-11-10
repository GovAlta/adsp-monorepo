import { AdspId } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { DestinationDisabledError, SharePointError, toSharePointError } from '../errors';
import { GraphFileClient, GraphTokenProvider } from '../graph';
import { itemKeyFor } from '../mapper';
import { sanitizePathSegment } from '../filename';
import { SharePointPusher } from '../push';
import { PushOutcome, SharePointConfiguration, SharePointConnection, SharePointDestination } from '../types';
import { assertDataPath, setValueAtPath } from './dataPath';
import { FileSource } from './source';

export interface FileRequest {
  field: string;
  fileId: string;
}

export type LinkFormat = 'hyperlink' | 'text';

export interface FilesUploadRequest {
  submissionId: string;
  files: FileRequest[];
  data?: Record<string, unknown>;
  linkFormat?: LinkFormat;
}

export interface UploadedFileResult {
  field: string;
  fileId: string;
  status: 'uploaded';
  id: string;
  name: string;
  url: string;
  size: number;
}

export interface FailedFileResult {
  field: string;
  fileId: string;
  status: 'failed';
  errorCode: string;
  retryable: boolean;
}

export type FileResult = UploadedFileResult | FailedFileResult;

export type RowResult =
  | { written: true; dataId: string; outcome: PushOutcome }
  | { written: false; errorCode: string; retryable: boolean };

export interface FilesUploadResult {
  files: FileResult[];
  row?: RowResult;
}

const DEFAULT_CONCURRENCY = 3;

function resolveDestination(
  configuration: SharePointConfiguration | undefined,
  destinationId: string,
): { destination: SharePointDestination; connection: SharePointConnection } {
  const destination = configuration?.destinations?.[destinationId];
  if (!destination) {
    throw new NotFoundError('SharePoint destination', destinationId);
  }
  const connection = configuration?.connections?.[destination.connectionId];
  if (!connection) {
    throw new NotFoundError('SharePoint connection', destination.connectionId);
  }
  return { destination, connection };
}

async function runLimited<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function uniqueName(name: string, used: Set<string>): string {
  let candidate = name;
  for (let counter = 2; used.has(candidate.toLowerCase()); counter++) {
    candidate = `${counter}-${name}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export class SharePointFileService {
  constructor(
    private tokens: GraphTokenProvider,
    private graph: GraphFileClient,
    private source: FileSource,
    private pusher: SharePointPusher,
    private concurrency: number = DEFAULT_CONCURRENCY,
  ) {}

  async upload(
    tenantId: AdspId,
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
    request: FilesUploadRequest,
  ): Promise<FilesUploadResult> {
    const { destination, connection } = resolveDestination(configuration, destinationId);
    if (destination.enabled === false) {
      throw new DestinationDisabledError(destinationId);
    }
    if (request.data) {
      request.files.forEach(({ field }) => assertDataPath(field));
      itemKeyFor(destination.idempotencyFields, request.data);
    }

    const token = await this.tokens.getToken(tenantId, connection);
    const folder = sanitizePathSegment(request.submissionId, 'submission');
    const usedNames = new Set<string>();

    const files = await runLimited(request.files, this.concurrency, (file) =>
      this.uploadOne(tenantId, token, connection, folder, file, usedNames),
    );

    if (!request.data) {
      return { files };
    }

    const data = JSON.parse(JSON.stringify(request.data)) as Record<string, unknown>;
    const linkFormat = request.linkFormat ?? 'hyperlink';
    files.forEach((file) => {
      if (file.status === 'uploaded') {
        setValueAtPath(data, file.field, linkFormat === 'text' ? file.url : { Url: file.url, Description: file.name });
      }
    });

    return { files, row: await this.writeRow(tenantId, configuration, destinationId, data) };
  }

  private async uploadOne(
    tenantId: AdspId,
    token: string,
    connection: SharePointConnection,
    folder: string,
    file: FileRequest,
    usedNames: Set<string>,
  ): Promise<FileResult> {
    try {
      const content = await this.source.open(tenantId, file.fileId);
      const name = uniqueName(sanitizePathSegment(content.filename, 'file'), usedNames);
      const uploaded = await this.graph.uploadFile(
        token,
        connection.siteId,
        folder,
        name,
        content.size,
        content.stream,
      );
      return {
        field: file.field,
        fileId: file.fileId,
        status: 'uploaded',
        id: uploaded.id,
        name: uploaded.name,
        url: uploaded.webUrl,
        size: uploaded.size,
      };
    } catch (err) {
      const error = err instanceof SharePointError ? err : toSharePointError(err);
      return {
        field: file.field,
        fileId: file.fileId,
        status: 'failed',
        errorCode: error.errorCode,
        retryable: error.retryable,
      };
    }
  }

  private async writeRow(
    tenantId: AdspId,
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
    data: Record<string, unknown>,
  ): Promise<RowResult> {
    try {
      const { itemId, outcome } = await this.pusher.push(tenantId, configuration, destinationId, data);
      return { written: true, dataId: itemId, outcome };
    } catch (err) {
      if (err instanceof SharePointError) {
        return { written: false, errorCode: err.errorCode, retryable: err.retryable };
      }
      throw err;
    }
  }
}
