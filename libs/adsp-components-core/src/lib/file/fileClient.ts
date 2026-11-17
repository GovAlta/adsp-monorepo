import { mapFile, mapFileType, getContentDispositionFilename, toResponseError } from './mapper';
import type { FileServiceFile, FileServiceFileType } from './mapper';
import { sendUpload } from './uploadRequest';
import type {
  DownloadedFile,
  FileMetadata,
  FileTypeInfo,
  IFileClient,
  IFileUploadClient,
  UploadFileOptions,
} from './types';

export interface FileClientOptions {
  /** Root URL of the File service, for example https://file-service.adsp.alberta.ca */
  serviceUrl: string;
  /** Without a token, requests are anonymous and only succeed for file types that allow anonymous read. */
  getAccessToken?: () => Promise<string | undefined>;
  fetch?: typeof fetch;
  /** Replaces `new XMLHttpRequest()` for uploads, for tests. Uploads use XHR because fetch can't report progress. */
  createXhr?: () => XMLHttpRequest;
}

const DEFAULT_MIME_TYPE = 'application/octet-stream';

export class FileClient implements IFileClient, IFileUploadClient {
  private readonly apiUrl: string;
  private readonly getAccessToken?: () => Promise<string | undefined>;
  private readonly fetchFn: typeof fetch;
  private readonly createXhr: () => XMLHttpRequest;

  constructor({ serviceUrl, getAccessToken, fetch: fetchFn, createXhr }: FileClientOptions) {
    this.apiUrl = new URL('/file/v1', serviceUrl).href;
    this.getAccessToken = getAccessToken;
    this.fetchFn = fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    this.createXhr = createXhr ?? (() => new XMLHttpRequest());
  }

  async getFileType(fileTypeId: string): Promise<FileTypeInfo> {
    const response = await this.request(`/types/${encodeURIComponent(fileTypeId)}`);
    if (!response.ok) {
      throw await toResponseError(response, 'File type request');
    }

    return mapFileType((await response.json()) as FileServiceFileType);
  }

  async uploadFile(fileTypeId: string, file: File, { recordId, onProgress, signal }: UploadFileOptions = {}) {
    // File service reads these fields before the file part arrives, so they must come first.
    const body = new FormData();
    body.append('type', fileTypeId);
    body.append('filename', file.name);
    if (file.type) {
      body.append('mimeType', file.type);
    }
    if (recordId) {
      body.append('recordId', recordId);
    }
    body.append('file', file);

    const uploaded = await sendUpload({
      xhr: this.createXhr(),
      url: `${this.apiUrl}/files`,
      token: await this.getAccessToken?.(),
      body,
      onProgress,
      signal,
    });
    return mapFile(uploaded as FileServiceFile);
  }

  async getFile(fileId: string): Promise<FileMetadata> {
    const response = await this.request(`/files/${encodeURIComponent(fileId)}`);
    if (!response.ok) {
      throw await toResponseError(response, 'File request');
    }

    return mapFile((await response.json()) as FileServiceFile);
  }

  // Never sends unsafe=true: a file whose virus scan is pending fails with reason 'scan-pending'.
  async downloadFile(fileId: string): Promise<DownloadedFile> {
    const response = await this.request(`/files/${encodeURIComponent(fileId)}/download`);
    if (!response.ok) {
      throw await toResponseError(response, 'File download');
    }

    const blob = await response.blob();
    return {
      blob,
      filename:
        getContentDispositionFilename(response.headers.get('Content-Disposition')) ??
        (await this.getFilenameFromMetadata(fileId)),
      mimeType: response.headers.get('Content-Type') || blob.type || DEFAULT_MIME_TYPE,
    };
  }

  // A browser on another origin can't read Content-Disposition unless File service exposes it through CORS,
  // so ask File service for the filename instead. The download already succeeded, so a failure here only costs
  // the name.
  private async getFilenameFromMetadata(fileId: string): Promise<string> {
    try {
      return (await this.getFile(fileId)).filename || fileId;
    } catch {
      return fileId;
    }
  }

  private async request(path: string): Promise<Response> {
    const token = await this.getAccessToken?.();
    return this.fetchFn(`${this.apiUrl}${path}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  }
}
