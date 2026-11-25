import axios from 'axios';
import { Readable } from 'stream';
import { SharePointError, toSharePointError } from '../errors';
import { requestWithRetry } from '../retry';
import { readAll, readChunks } from './chunker';

export const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024;
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
const CHUNK_SIZE_UNIT = 320 * 1024;

export interface UploadedFile {
  id: string;
  name: string;
  webUrl: string;
  size: number;
}

interface DriveItem {
  id: string;
  name: string;
  webUrl: string;
  size: number;
}

interface LibraryDrive {
  id?: string;
  driveType?: string;
}

const encodeSegment = (value: string) => encodeURIComponent(value).replace(/%2C/gi, ',');

const toUploadedFile = ({ id, name, webUrl, size }: DriveItem): UploadedFile => ({ id, name, webUrl, size });

export class GraphFileClient {
  private chunkSize: number;

  constructor(
    private graphUrl: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
  ) {
    this.chunkSize = Math.max(CHUNK_SIZE_UNIT, Math.floor(chunkSize / CHUNK_SIZE_UNIT) * CHUNK_SIZE_UNIT);
  }

  private itemPath(siteId: string, folder: string, filename: string, driveId?: string): string {
    return `${this.folderPath(siteId, folder, driveId)}/${encodeURIComponent(filename)}:`;
  }

  private get baseUrl(): string {
    return this.graphUrl.replace(/\/$/, '');
  }

  // Without a drive ID, files go to the site's default document library.
  private folderPath(siteId: string, folder: string, driveId?: string): string {
    const drive = driveId ? `drives/${encodeSegment(driveId)}` : `sites/${encodeSegment(siteId)}/drive`;
    return `${this.baseUrl}/${drive}/root:/${encodeURIComponent(folder)}`;
  }

  private headers(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  // Graph answers an ordinary list's drive request with an empty drive rather than an error.
  async getLibraryDriveId(token: string, siteId: string, libraryId: string): Promise<string> {
    const url = `${this.baseUrl}/sites/${encodeSegment(siteId)}/lists/${encodeSegment(libraryId)}/drive`;
    let drive: LibraryDrive;
    try {
      const { data } = await requestWithRetry(() => axios.get<LibraryDrive>(url, { headers: this.headers(token) }));
      drive = data;
    } catch (err) {
      if (err instanceof SharePointError && err.errorCode === 'graph:itemNotFound') {
        throw new SharePointError('document-library-not-found', false);
      }
      throw err;
    }
    if (!drive?.id || drive.driveType !== 'documentLibrary') {
      throw new SharePointError('not-a-document-library', false);
    }
    return drive.id;
  }

  async getFolderUrl(token: string, siteId: string, folder: string, driveId?: string): Promise<string> {
    const { data } = await requestWithRetry(() =>
      axios.get<{ webUrl: string }>(this.folderPath(siteId, folder, driveId), {
        headers: this.headers(token),
        params: { $select: 'webUrl' },
      }),
    );
    return data.webUrl;
  }

  async uploadFile(
    token: string,
    siteId: string,
    folder: string,
    filename: string,
    size: number,
    stream: Readable,
    driveId?: string,
  ): Promise<UploadedFile> {
    const path = this.itemPath(siteId, folder, filename, driveId);
    try {
      return size <= SIMPLE_UPLOAD_LIMIT
        ? await this.simpleUpload(token, path, size, stream)
        : await this.sessionUpload(token, path, size, stream);
    } catch (err) {
      stream.destroy();
      throw toSharePointError(err);
    }
  }

  private async simpleUpload(token: string, path: string, size: number, stream: Readable): Promise<UploadedFile> {
    // Read into memory (4 MB at most) so a failed request can be sent again; a used stream can't be replayed.
    const content = await readAll(stream);
    if (content.length !== size) {
      throw new SharePointError('file:size-mismatch', false);
    }

    const { data } = await requestWithRetry(() =>
      axios.put<DriveItem>(`${path}/content`, content, {
        headers: { ...this.headers(token), 'Content-Type': 'application/octet-stream', 'Content-Length': size },
        maxBodyLength: Infinity,
      }),
    );
    return toUploadedFile(data);
  }

  private async sessionUpload(token: string, path: string, size: number, stream: Readable): Promise<UploadedFile> {
    const { data: session } = await requestWithRetry(() =>
      axios.post<{ uploadUrl: string }>(
        `${path}/createUploadSession`,
        { item: { '@microsoft.graph.conflictBehavior': 'replace' } },
        { headers: this.headers(token) },
      ),
    );

    try {
      let offset = 0;
      let item: DriveItem | undefined;
      for await (const chunk of readChunks(stream, this.chunkSize)) {
        const end = offset + chunk.length - 1;
        // Only the failed chunk is sent again, the session and the chunks before it are kept.
        const response = await requestWithRetry(() =>
          axios.put<DriveItem>(session.uploadUrl, chunk, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': chunk.length,
              'Content-Range': `bytes ${offset}-${end}/${size}`,
            },
            maxBodyLength: Infinity,
          }),
        );
        offset = end + 1;
        if (response.status === 200 || response.status === 201) {
          item = response.data;
        }
      }

      if (!item || offset !== size) {
        throw new SharePointError('file:size-mismatch', false);
      }
      return toUploadedFile(item);
    } catch (err) {
      await axios.delete(session.uploadUrl).catch(() => undefined);
      throw err;
    }
  }
}
