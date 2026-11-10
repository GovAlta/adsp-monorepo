import axios from 'axios';
import { Readable } from 'stream';
import { SharePointError, toSharePointError } from '../errors';
import { readChunks } from './chunker';

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

  private itemPath(siteId: string, folder: string, filename: string): string {
    const root = `${this.graphUrl.replace(/\/$/, '')}/sites/${encodeSegment(siteId)}/drive/root:`;
    return `${root}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}:`;
  }

  private headers(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async uploadFile(
    token: string,
    siteId: string,
    folder: string,
    filename: string,
    size: number,
    stream: Readable,
  ): Promise<UploadedFile> {
    const path = this.itemPath(siteId, folder, filename);
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
    const { data } = await axios.put<DriveItem>(`${path}/content`, stream, {
      headers: { ...this.headers(token), 'Content-Type': 'application/octet-stream', 'Content-Length': size },
      maxBodyLength: Infinity,
    });
    return toUploadedFile(data);
  }

  private async sessionUpload(token: string, path: string, size: number, stream: Readable): Promise<UploadedFile> {
    const { data: session } = await axios.post<{ uploadUrl: string }>(
      `${path}/createUploadSession`,
      { item: { '@microsoft.graph.conflictBehavior': 'replace' } },
      { headers: this.headers(token) },
    );

    try {
      let offset = 0;
      let item: DriveItem | undefined;
      for await (const chunk of readChunks(stream, this.chunkSize)) {
        const end = offset + chunk.length - 1;
        const response = await axios.put<DriveItem>(session.uploadUrl, chunk, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': chunk.length,
            'Content-Range': `bytes ${offset}-${end}/${size}`,
          },
          maxBodyLength: Infinity,
        });
        offset = end + 1;
        if (response.status === 200 || response.status === 201) {
          item = response.data;
        }
      }

      if (!item || offset !== size) {
        throw new SharePointError('file-size-mismatch', false);
      }
      return toUploadedFile(item);
    } catch (err) {
      await axios.delete(session.uploadUrl).catch(() => undefined);
      throw err;
    }
  }
}
