import { AdspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { DestinationDisabledError, SharePointError, toSharePointError } from '../errors';
import { GraphFileClient, GraphTokenProvider } from '../graph';
import { itemKeyFor } from '../mapper';
import { sanitizePathSegment } from '../filename';
import { SharePointPusher } from '../push';
import { PushOutcome, SharePointConfiguration, SharePointConnection, SharePointDestination } from '../types';
import { assertDataPath, setValueAtPath } from './dataPath';
import { FileContent, FileSource } from './source';

export interface FileRequest {
  field: string;
  fileId: string;
}

export interface FilesUploadRequest {
  submissionId: string;
  files: FileRequest[];
  data?: Record<string, unknown>;
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

export const MAX_FILES = 20;
const DEFAULT_CONCURRENCY = 3;
const REJECTED_TOKEN_CODE = 'graph:InvalidAuthenticationToken';

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

function assertFileCount(count: number): void {
  if (count > MAX_FILES) {
    throw new InvalidOperationError(`A request can have at most ${MAX_FILES} files.`);
  }
}

async function runLimited<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  assertFileCount(items.length);
  const results: R[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(Math.max(limit, 1), MAX_FILES) }, async () => {
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

class NameAssigner {
  private used = new Set<string>();
  private turns: { done: Promise<void>; release: () => void }[];

  constructor(count: number) {
    assertFileCount(count);
    this.turns = Array.from({ length: count }, () => {
      let release: () => void = () => undefined;
      const done = new Promise<void>((resolve) => {
        release = resolve;
      });
      return { done, release };
    });
  }

  async assign(index: number, name: string | null): Promise<string | null> {
    if (index > 0) {
      await this.turns[index - 1].done;
    }
    const assigned = name === null ? null : uniqueName(name, this.used);
    this.turns[index].release();
    return assigned;
  }
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
    assertFileCount(request.files.length);
    if (request.data) {
      request.files.forEach(({ field }) => assertDataPath(field));
      itemKeyFor(destination.idempotencyFields, request.data);
    }

    await this.tokens.getToken(tenantId, connection);
    const folder = sanitizePathSegment(request.submissionId, 'submission');
    const names = new NameAssigner(request.files.length);

    const files = await runLimited(
      request.files.map((file, index) => ({ file, index })),
      this.concurrency,
      ({ file, index }) => this.uploadOne(tenantId, connection, folder, file, index, names),
    );

    if (!request.data || files.some(({ status }) => status === 'failed')) {
      return { files };
    }

    const data = JSON.parse(JSON.stringify(request.data)) as Record<string, unknown>;
    files.forEach((file) => {
      if (file.status === 'uploaded') {
        const format = destination.fieldMappings.find(({ source }) => source === file.field)?.linkFormat;
        setValueAtPath(data, file.field, format === 'text' ? file.url : { Url: file.url, Description: file.name });
      }
    });

    return { files, row: await this.writeRow(tenantId, configuration, destinationId, data) };
  }

  private async uploadOne(
    tenantId: AdspId,
    connection: SharePointConnection,
    folder: string,
    file: FileRequest,
    index: number,
    names: NameAssigner,
  ): Promise<FileResult> {
    let content: FileContent | undefined;
    let openError: unknown;
    try {
      content = await this.source.open(tenantId, file.fileId);
    } catch (err) {
      openError = err;
    }

    const name = await names.assign(index, content ? sanitizePathSegment(content.filename, 'file') : null);

    try {
      if (!content || name === null) {
        throw openError;
      }
      const uploaded = await this.uploadWithRetry(tenantId, connection, folder, file, name, content);
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

  private async uploadWithRetry(
    tenantId: AdspId,
    connection: SharePointConnection,
    folder: string,
    file: FileRequest,
    name: string,
    content: FileContent,
  ) {
    const attempt = async (source: FileContent) =>
      this.graph.uploadFile(
        await this.tokens.getToken(tenantId, connection),
        connection.siteId,
        folder,
        name,
        source.size,
        source.stream,
      );

    try {
      return await attempt(content);
    } catch (err) {
      if (!(err instanceof SharePointError) || err.errorCode !== REJECTED_TOKEN_CODE) {
        throw err;
      }
      this.tokens.evict(tenantId, connection.id);
      return attempt(await this.source.open(tenantId, file.fileId));
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
