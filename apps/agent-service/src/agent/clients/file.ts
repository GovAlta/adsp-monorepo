import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';

class FileServiceClient {
  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  public async getFileAndMetadata(
    tenantId: AdspId,
    fileId: AdspId
  ): Promise<{
    data: Uint8Array;
    metadata: {
      filename: string;
      mimeType: string;
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
}

interface FileServiceClientProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}
export function createFileServiceClient({ logger, directory, tokenProvider }: FileServiceClientProps) {
  return new FileServiceClient(logger, directory, tokenProvider);
}
