import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { createReadStream, promises as fs } from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { SharePointError } from '../errors';

export interface FileContent {
  stream: Readable;
  size: number;
  filename: string;
}

export interface FileSource {
  open(tenantId: AdspId, fileId: string): Promise<FileContent>;
}

const LOCAL_PREFIX = 'local:';
const PLAIN_ID_PATTERN = /^[a-zA-Z0-9-]{1,100}$/;
const FILE_SERVICE = 'file-service';
const PLATFORM_NAMESPACE = 'platform';
const FILE_RESOURCE_PATTERN = /^\/files\/[a-zA-Z0-9-]{1,100}$/;

const invalidReference = () => new SharePointError('file:invalid-reference', false);

export class LocalFileSource implements FileSource {
  private root: string;

  constructor(directory: string) {
    this.root = path.resolve(directory);
  }

  async open(_tenantId: AdspId, fileId: string): Promise<FileContent> {
    if (!fileId.startsWith(LOCAL_PREFIX)) {
      throw invalidReference();
    }

    const resolved = path.resolve(this.root, fileId.slice(LOCAL_PREFIX.length));
    if (path.dirname(resolved) !== this.root) {
      throw invalidReference();
    }

    const stats = await fs.stat(resolved).catch(() => null);
    if (!stats?.isFile()) {
      throw new SharePointError('file:not-found', false);
    }

    return { stream: createReadStream(resolved), size: stats.size, filename: path.basename(resolved) };
  }
}

function toFileServiceError(err: unknown): SharePointError {
  if (err instanceof SharePointError) {
    return err;
  }
  if (!axios.isAxiosError(err) || !err.response) {
    return new SharePointError('file:unavailable', true);
  }
  const { status } = err.response;
  if (status === 401 || status === 403) {
    return new SharePointError('file:access-denied', false);
  }
  if (status === 404) {
    return new SharePointError('file:not-found', false);
  }
  if (status === 400) {
    return new SharePointError('file:not-ready', true);
  }
  return new SharePointError('file:unavailable', status >= 500);
}

export class FileServiceSource implements FileSource {
  constructor(
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
  ) {}

  private toFileUrn(fileId: string): AdspId {
    if (PLAIN_ID_PATTERN.test(fileId)) {
      return AdspId.parse(`urn:ads:${PLATFORM_NAMESPACE}:${FILE_SERVICE}:v1:/files/${fileId}`);
    }

    let urn: AdspId;
    try {
      urn = AdspId.parse(fileId);
    } catch {
      throw invalidReference();
    }
    if (
      urn.type !== 'resource' ||
      urn.namespace !== PLATFORM_NAMESPACE ||
      urn.service !== FILE_SERVICE ||
      !FILE_RESOURCE_PATTERN.test(urn.resource ?? '')
    ) {
      throw invalidReference();
    }
    return urn;
  }

  async open(tenantId: AdspId, fileId: string): Promise<FileContent> {
    const urn = this.toFileUrn(fileId);
    try {
      const resourceUrl = await this.directory.getResourceUrl(urn);
      const token = await this.tokenProvider.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const params = { tenantId: tenantId.toString() };

      const isDownloadUrl = resourceUrl.pathname.endsWith('/download');
      const fileUrl = isDownloadUrl
        ? new URL(resourceUrl.pathname.replace(/\/download$/, ''), resourceUrl)
        : resourceUrl;
      const downloadUrl = isDownloadUrl ? resourceUrl : new URL(`${resourceUrl.pathname}/download`, resourceUrl);

      const { data: metadata } = await axios.get<{ filename: string; size: number }>(fileUrl.href, {
        headers,
        params,
      });
      const response = await axios.get<Readable>(downloadUrl.href, { headers, params, responseType: 'stream' });

      return { stream: response.data, size: Number(metadata.size), filename: metadata.filename };
    } catch (err) {
      throw toFileServiceError(err);
    }
  }
}
