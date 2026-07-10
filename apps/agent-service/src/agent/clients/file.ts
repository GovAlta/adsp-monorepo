import { AdspId, adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Readable } from 'node:stream';
import { Logger } from 'winston';

export interface FileTypeInfo {
  id: string;
  name: string;
  anonymousRead: boolean;
  // True when a retention rule actively deletes files, even if the day count is not set.
  retentionActive: boolean;
  // Days until auto-delete; null when unknown or when retention is inactive.
  retentionDays: number | null;
}

export interface IFileServiceClient {
  getFileAndMetadata(
    tenantId: AdspId,
    fileId: AdspId,
  ): Promise<{
    data: Uint8Array;
    metadata: {
      filename: string;
      mimeType: string;
      urn: string;
      typeName?: string;
    };
  }>;

  getFileTypeInfo(tenantId: AdspId, typeName: string): Promise<FileTypeInfo | null>;

  getFileStream(
    tenantId: AdspId,
    fileId: AdspId,
  ): Promise<{
    stream: Readable;
    metadata: {
      filename: string;
      mimeType: string;
      urn: string;
      typeName?: string;
    };
  }>;
}

// File types change rarely; cache lookups briefly to avoid a full types fetch per attachment.
const FILE_TYPE_CACHE_TTL_MS = 5 * 60 * 1000;

class FileServiceClient implements IFileServiceClient {
  private fileTypeCache = new Map<string, { info: FileTypeInfo | null; retrievedAt: number }>();

  constructor(
    private logger: Logger,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
  ) {}

  public async getFileAndMetadata(
    tenantId: AdspId,
    fileId: AdspId,
  ): Promise<{
    data: Uint8Array;
    metadata: {
      filename: string;
      mimeType: string;
      urn: string;
      typeName?: string;
    };
  }> {
    const resourceUrl = await this.directory.getResourceUrl(fileId);

    const fileUrl = resourceUrl.pathname.endsWith('/download')
      ? new URL(resourceUrl.pathname.replace('/download', ''), resourceUrl)
      : resourceUrl;
    const { data: metadata } = await axios.get(fileUrl.href, {
      params: {
        tenantId: tenantId?.toString(),
      },
      headers: {
        Authorization: `Bearer ${await this.tokenProvider.getAccessToken()}`,
      },
    });

    const fileDownloadUrl = resourceUrl.pathname.endsWith('/download')
      ? resourceUrl
      : new URL(`${resourceUrl.pathname}/download`, resourceUrl);
    const { data } = await axios.get(fileDownloadUrl.href, {
      params: {
        tenantId: tenantId?.toString(),
      },
      headers: {
        Authorization: `Bearer ${await this.tokenProvider.getAccessToken()}`,
      },
      responseType: 'arraybuffer',
    });

    this.logger.debug(`File downloaded: ${fileId}`, {
      context: 'FileServiceClient',
      tenant: tenantId?.toString(),
    });

    return {
      data: new Uint8Array(data),
      metadata,
    };
  }

  public async getFileStream(
    tenantId: AdspId,
    fileId: AdspId,
  ): Promise<{
    stream: Readable;
    metadata: {
      filename: string;
      mimeType: string;
      urn: string;
      typeName?: string;
    };
  }> {
    const resourceUrl = await this.directory.getResourceUrl(fileId);

    const fileUrl = resourceUrl.pathname.endsWith('/download')
      ? new URL(resourceUrl.pathname.replace('/download', ''), resourceUrl)
      : resourceUrl;
    const { data: metadata } = await axios.get(fileUrl.href, {
      params: {
        tenantId: tenantId?.toString(),
      },
      headers: {
        Authorization: `Bearer ${await this.tokenProvider.getAccessToken()}`,
      },
    });

    const fileDownloadUrl = resourceUrl.pathname.endsWith('/download')
      ? resourceUrl
      : new URL(`${resourceUrl.pathname}/download`, resourceUrl);
    const response = await axios.get(fileDownloadUrl.href, {
      params: {
        tenantId: tenantId?.toString(),
      },
      headers: {
        Authorization: `Bearer ${await this.tokenProvider.getAccessToken()}`,
      },
      responseType: 'stream',
    });

    this.logger.debug(`File stream opened: ${fileId}`, {
      context: 'FileServiceClient',
      tenant: tenantId?.toString(),
    });

    return {
      stream: response.data as Readable,
      metadata,
    };
  }

  public async getFileTypeInfo(tenantId: AdspId, typeName: string): Promise<FileTypeInfo | null> {
    const cacheKey = `${tenantId}:${typeName}`;
    const cached = this.fileTypeCache.get(cacheKey);
    if (cached && Date.now() - cached.retrievedAt < FILE_TYPE_CACHE_TTL_MS) {
      return cached.info;
    }

    try {
      const fileServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:file-service`);
      const typesUrl = new URL('file/v1/types', fileServiceUrl);

      const { data } = await axios.get<
        Array<{
          id: string;
          name: string;
          anonymousRead: boolean;
          rules?: { retention?: { active?: boolean; deleteInDays?: number } };
        }>
      >(typesUrl.href, {
        params: { tenantId: tenantId?.toString() },
        headers: { Authorization: `Bearer ${await this.tokenProvider.getAccessToken()}` },
      });

      // File metadata carries the type's display name (see file-service mapFile), so match by name.
      const fileType = data.find((type) => type.name === typeName);
      const retentionActive = !!fileType?.rules?.retention?.active;
      const info: FileTypeInfo | null = fileType
        ? {
            id: fileType.id,
            name: fileType.name,
            anonymousRead: fileType.anonymousRead,
            retentionActive,
            retentionDays: retentionActive ? (fileType.rules?.retention?.deleteInDays ?? null) : null,
          }
        : null;

      this.fileTypeCache.set(cacheKey, { info, retrievedAt: Date.now() });
      return info;
    } catch (err) {
      this.logger.warn(
        `Failed to retrieve file type info for '${typeName}': ${err instanceof Error ? err.message : String(err)}`,
        { context: 'FileServiceClient', tenant: tenantId?.toString() },
      );
      return null;
    }
  }

  public async copyFile(
    tenantId: AdspId,
    fileId: AdspId,
    token: string,
    filename?: string,
    type?: string,
    recordId?: string,
  ): Promise<{
    urn: string;
    filename: string;
    mimeType: string;
  }> {
    const fileUrl = await this.directory.getResourceUrl(fileId);
    const { data } = await axios.post(
      fileUrl.href,
      {
        operation: 'copy',
        type,
        filename,
        recordId,
      },
      {
        params: {
          tenantId: tenantId?.toString(),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {
      urn: data.urn,
      filename: data.filename,
      mimeType: data.mimeType,
    };
  }
}

interface FileServiceClientProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}
export function createFileServiceClient({ logger, directory, tokenProvider }: FileServiceClientProps) {
  return new FileServiceClient(logger, directory, tokenProvider);
}
