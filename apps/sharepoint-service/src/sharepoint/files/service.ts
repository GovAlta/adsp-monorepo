import { AdspId } from '@abgov/adsp-service-sdk';
import type { DomainEvent, EventService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { runLimited } from '../concurrency';
import { setValueAtPath } from '../dataPath';
import { DestinationDisabledError, DetailRowsFailedError, SharePointError, toSharePointError } from '../errors';
import { GraphFileClient, GraphTokenProvider } from '../graph';
import { itemKeyFor } from '../mapper';
import { sanitizePathSegment } from '../filename';
import { PushOptions, SharePointPusher } from '../push';
import {
  DetailFailure,
  DetailRows,
  FieldMapping,
  LinkFormat,
  PushOutcome,
  SharePointConfiguration,
  SharePointConnection,
  SharePointDestination,
} from '../types';
import { withToken } from '../withToken';
import { fileUploaded, fileUploadFailed } from './events';
import { FileContent, FileSource } from './source';

interface RowTarget {
  destination: SharePointDestination;
  connection: SharePointConnection;
  folder: string;
}

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
  | { written: true; dataId: string; outcome: PushOutcome; detailRows?: DetailRows[] }
  | { written: false; errorCode: string; retryable: boolean; dataId?: string; detailFailures?: DetailFailure[] };

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

// Placing a placeholder at each file's path checks every path fits the data before anything is uploaded.
function prepareRowData(
  destination: SharePointDestination,
  data: Record<string, unknown>,
  files: FileRequest[],
): Record<string, unknown> {
  itemKeyFor(destination.idempotencyFields, data);
  const copy = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
  files.forEach(({ field }) => setValueAtPath(copy, field, null));
  return copy;
}

async function runFileTasks<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  assertFileCount(items.length);
  return runLimited(items, Math.min(limit, MAX_FILES), task);
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const linkFormatOf = ({ columnType, linkFormat }: FieldMapping): LinkFormat | undefined => {
  if (!columnType) {
    return linkFormat;
  }
  return columnType === 'text' || columnType === 'multilineText' ? 'text' : 'hyperlink';
};

function linkFormatFor(destination: SharePointDestination, field: string): LinkFormat | undefined {
  const direct = destination.fieldMappings.find(({ source }) => source === field);
  if (direct) {
    return linkFormatOf(direct);
  }
  for (const list of destination.detailLists ?? []) {
    const relative = new RegExp(`^${escapeRegExp(list.dataPath)}(?:\\[\\d+\\]|\\.\\d+)\\.(.+)$`).exec(field)?.[1];
    const mapping = relative && list.fieldMappings.find(({ source }) => source === relative);
    if (mapping) {
      return linkFormatOf(mapping);
    }
  }
  return undefined;
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
    private eventService: EventService,
    private concurrency: number = DEFAULT_CONCURRENCY,
  ) {}

  private signal(event: DomainEvent): void {
    try {
      this.eventService.send(event);
    } catch {
      return;
    }
  }

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
    const data = request.data && prepareRowData(destination, request.data, request.files);

    await this.tokens.getToken(tenantId, connection);
    const folder = sanitizePathSegment(request.submissionId, 'submission');
    const names = new NameAssigner(request.files.length);

    const files = await runFileTasks(
      request.files.map((file, index) => ({ file, index })),
      this.concurrency,
      ({ file, index }) =>
        this.uploadOne(tenantId, connection, folder, file, index, names, destinationId, request.submissionId),
    );

    if (!data || files.some(({ status }) => status === 'failed')) {
      return { files };
    }

    files.forEach((file) => {
      if (file.status === 'uploaded') {
        const format = linkFormatFor(destination, file.field);
        setValueAtPath(data, file.field, format === 'text' ? file.url : { Url: file.url, Description: file.name });
      }
    });

    return {
      files,
      row: await this.writeRow(tenantId, configuration, destinationId, { destination, connection, folder }, data),
    };
  }

  private async uploadOne(
    tenantId: AdspId,
    connection: SharePointConnection,
    folder: string,
    file: FileRequest,
    index: number,
    names: NameAssigner,
    destinationId: string,
    submissionId: string,
  ): Promise<FileResult> {
    const eventRequest = { tenantId, destinationId, submissionId, field: file.field, fileId: file.fileId };
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
      this.signal(fileUploaded(eventRequest, uploaded.id, uploaded.size));
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
      this.signal(fileUploadFailed(eventRequest, error.errorCode, error.retryable));
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
    { destination, connection, folder }: RowTarget,
    data: Record<string, unknown>,
  ): Promise<RowResult> {
    try {
      const options: PushOptions = {};
      if (destination.folderLinkField) {
        options.folderLink = {
          Url: await withToken(this.tokens, tenantId, connection, (token) =>
            this.graph.getFolderUrl(token, connection.siteId, folder),
          ),
          Description: folder,
        };
      }
      const { itemId, outcome, detailRows } = await this.pusher.push(
        tenantId,
        configuration,
        destinationId,
        data,
        options,
      );
      return { written: true, dataId: itemId, outcome, ...(detailRows ? { detailRows } : {}) };
    } catch (err) {
      if (err instanceof DetailRowsFailedError) {
        const { errorCode, retryable, dataId, detailFailures } = err;
        return { written: false, errorCode, retryable, dataId, detailFailures };
      }
      if (err instanceof SharePointError) {
        return { written: false, errorCode: err.errorCode, retryable: err.retryable };
      }
      throw err;
    }
  }
}
