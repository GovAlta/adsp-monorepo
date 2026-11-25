import { AdspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { runLimited } from '../concurrency';
import { setValueAtPath } from '../dataPath';
import { resolveDestination } from '../destinations';
import {
  DestinationDisabledError,
  DestinationNotSetUpError,
  DetailRowsFailedError,
  SharePointError,
  toSharePointError,
} from '../errors';
import { GraphFileClient, GraphTokenProvider } from '../graph';
import { LibraryDriveResolver } from '../libraryDrives';
import { itemKeyFor } from '../mapper';
import { sanitizePathSegment } from '../filename';
import { prepareDetailLists, PushOptions, SharePointPusher } from '../push';
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
import { FileContent, FileSource } from './source';

// Where a submission's files go: its folder, in the destination's document library or the site's default one.
interface UploadTarget {
  connection: SharePointConnection;
  folder: string;
  driveId?: string;
}

interface RowTarget extends UploadTarget {
  destination: SharePointDestination;
}

export interface FileRequest {
  field: string;
  fileId: string;
}

export interface FilesUploadRequest {
  submissionId: string;
  files: FileRequest[];
  data?: Record<string, unknown>;
  updateRowOnly?: boolean;
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
  | {
      written: false;
      errorCode: string;
      retryable: boolean;
      dataId?: string;
      outcome?: PushOutcome;
      detailFailures?: DetailFailure[];
    };

export interface FilesUploadResult {
  files: FileResult[];
  row?: RowResult;
}

export const MAX_FILES = 20;
const DEFAULT_CONCURRENCY = 3;
const REJECTED_TOKEN_CODE = 'graph:InvalidAuthenticationToken';

function assertFileCount(count: number): void {
  if (count > MAX_FILES) {
    throw new InvalidOperationError(`A request can have at most ${MAX_FILES} files.`);
  }
}

// A library that is named but not created yet must not fall back to the site's Documents library.
function documentLibraryIdOf(destination: SharePointDestination): string | undefined {
  if (destination.documentFilesLibraryName && !destination.documentFilesLibraryId) {
    throw new DestinationNotSetUpError(destination.id);
  }
  return destination.documentFilesLibraryId;
}

// Checks the row before any file is uploaded, so no file reaches SharePoint for a row that can't be written.
// A placeholder at each file's path checks the path fits the data. Updating only the row leaves detail lists alone.
function prepareRowData(
  destination: SharePointDestination,
  data: Record<string, unknown>,
  files: FileRequest[],
  updateRowOnly?: boolean,
): Record<string, unknown> {
  itemKeyFor(destination.idempotencyFields, data);
  if (!updateRowOnly) {
    prepareDetailLists(destination, data);
  }
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
    private drives: LibraryDriveResolver,
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
    const libraryId = documentLibraryIdOf(destination);
    const data = request.data && prepareRowData(destination, request.data, request.files, request.updateRowOnly);

    await this.tokens.getToken(tenantId, connection);
    const target: UploadTarget = {
      connection,
      folder: sanitizePathSegment(request.submissionId, 'submission'),
      driveId: await this.drives.driveFor(tenantId, connection, libraryId),
    };
    const names = new NameAssigner(request.files.length);

    const files = await runFileTasks(
      request.files.map((file, index) => ({ file, index })),
      this.concurrency,
      ({ file, index }) => this.uploadOne(tenantId, target, file, index, names),
    );
    if (libraryId && files.some((file) => file.status === 'failed' && file.errorCode === 'graph:itemNotFound')) {
      this.drives.evict(tenantId, connection, libraryId);
    }

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
      row: await this.writeRow(
        tenantId,
        configuration,
        destinationId,
        { ...target, destination },
        data,
        request.updateRowOnly,
      ),
    };
  }

  // Lets Test report a library that can't be used, since Test writes a row but uploads no files.
  async checkDocumentLibrary(
    tenantId: AdspId,
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
  ): Promise<void> {
    const { destination, connection } = resolveDestination(configuration, destinationId);
    await this.drives.driveFor(tenantId, connection, documentLibraryIdOf(destination), { fresh: true });
  }

  private async uploadOne(
    tenantId: AdspId,
    target: UploadTarget,
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
      const uploaded = await this.uploadWithRetry(tenantId, target, file, name, content);
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
    { connection, folder, driveId }: UploadTarget,
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
        driveId,
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
    { destination, connection, folder, driveId }: RowTarget,
    data: Record<string, unknown>,
    updateRowOnly?: boolean,
  ): Promise<RowResult> {
    try {
      const options: PushOptions = { updateRowOnly };
      if (destination.folderLinkField) {
        options.folderLink = {
          Url: await withToken(this.tokens, tenantId, connection, (token) =>
            this.graph.getFolderUrl(token, connection.siteId, folder, driveId),
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
        const { errorCode, retryable, dataId, outcome, detailFailures } = err;
        return { written: false, errorCode, retryable, dataId, outcome, detailFailures };
      }
      if (err instanceof SharePointError) {
        return { written: false, errorCode: err.errorCode, retryable: err.retryable };
      }
      throw err;
    }
  }
}
