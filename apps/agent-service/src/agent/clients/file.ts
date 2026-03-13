import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';

class FileServiceClient {
  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) { }

  public async getFileAndMetadata(
    tenantId: AdspId,
    fileId: AdspId
  ): Promise<{
    data: Uint8Array;
    metadata: {
      filename: string;
      mimeType: string;
      urn: string;
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

  public async copyFile(
    tenantId: AdspId,
    fileId: AdspId,
    token: string,
    filename?: string,
    type?: string,
    recordId?: string): Promise<{
      urn: string;
      filename: string;
      mimeType: string;
    }> {
    const fileUrl = await this.directory.getResourceUrl(fileId);
    const { data } = await axios.post(fileUrl.href, {
      operation: 'copy',
      type,
      filename,
      recordId
    }, {
      params: {
        tenantId: tenantId?.toString(),
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
