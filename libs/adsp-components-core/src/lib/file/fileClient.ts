import { mapFile, getContentDispositionFilename, toResponseError } from './mapper';
import type { FileServiceFile } from './mapper';
import type { DownloadedFile, FileMetadata, IFileClient } from './types';

export interface FileClientOptions {
  /** Root URL of the File service, for example https://file-service.adsp.alberta.ca */
  serviceUrl: string;
  /** Without a token, requests are anonymous and only succeed for file types that allow anonymous read. */
  getAccessToken?: () => Promise<string | undefined>;
  fetch?: typeof fetch;
}

const DEFAULT_MIME_TYPE = 'application/octet-stream';

export class FileClient implements IFileClient {
  private readonly apiUrl: string;
  private readonly getAccessToken?: () => Promise<string | undefined>;
  private readonly fetchFn: typeof fetch;

  constructor({ serviceUrl, getAccessToken, fetch: fetchFn }: FileClientOptions) {
    this.apiUrl = new URL('/file/v1', serviceUrl).href;
    this.getAccessToken = getAccessToken;
    this.fetchFn = fetchFn ?? ((input, init) => globalThis.fetch(input, init));
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
