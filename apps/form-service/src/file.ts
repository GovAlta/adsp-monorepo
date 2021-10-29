import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';

export interface FileService {
  delete(tenantId: AdspId, urn: AdspId): Promise<boolean>;
}

const LOG_CONTEXT = { context: 'FileService' };
export class FileServiceImpl implements FileService {
  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  async delete(tenantId: AdspId, fileId: AdspId): Promise<boolean> {
    try {
      const fileUrl = await this.directory.getResourceUrl(fileId);
      const token = await this.tokenProvider.getAccessToken();

      const { data } = await axios.delete<{ deleted: boolean }>(fileUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data.deleted;
    } catch (err) {
      this.logger.warn(`Error encountered deleting file ${fileId}. ${err}`, {
        ...LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    }
  }
}

export function createFileService(
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider
): FileService {
  return new FileServiceImpl(logger, directory, tokenProvider);
}
