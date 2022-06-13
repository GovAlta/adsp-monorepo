import { AdspId, adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as FormData from 'form-data';
import { Logger } from 'winston';
import { FileResult, FileService } from './pdf';

class PlatformFileService implements FileService {
  constructor(private logger: Logger, private tokenProvider: TokenProvider, private directory: ServiceDirectory) {}

  async typeExists(tenantId: AdspId, typeId: string): Promise<boolean> {
    try {
      const fileServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:file-service`);
      const filesUrl = new URL(`/file/v1/types/${typeId}`, fileServiceUrl);
      const token = await this.tokenProvider.getAccessToken();

      const { data } = await axios.get<{ id: string }>(filesUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: `${tenantId}` },
      });

      return !!data.id;
    } catch (err) {
      this.logger.debug(
        `File service find file type failed with error. ${
          axios.isAxiosError(err) ? JSON.stringify(err.toJSON(), null, 2) : err
        }`,
        {
          context: 'PlatformFileService',
        }
      );
      return false;
    }
  }

  async upload(
    tenantId: AdspId,
    fileType: string,
    recordId: string,
    filename: string,
    content: Buffer
  ): Promise<FileResult> {
    try {
      const formData = new FormData();
      formData.append('type', fileType);
      formData.append('recordId', recordId);
      formData.append('filename', filename);
      formData.append('file', content, filename);

      const fileServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:file-service`);
      const filesUrl = new URL('/file/v1/files', fileServiceUrl);
      const token = await this.tokenProvider.getAccessToken();

      const { data } = await axios.post<FileResult>(filesUrl.href, formData, {
        headers: { ...formData.getHeaders(), Authorization: `Bearer ${token}` },
        params: { tenantId: `${tenantId}` },
      });

      return data;
    } catch (err) {
      this.logger.warn(`Upload to file service failed with error. ${axios.isAxiosError(err) ? err.toJSON() : err}`, {
        context: 'PlatformFileService',
      });
      throw err;
    }
  }
}

interface FileServiceProps {
  logger: Logger;
  tokenProvider: TokenProvider;
  directory: ServiceDirectory;
}

export function createFileService({ logger, tokenProvider, directory }: FileServiceProps): FileService {
  return new PlatformFileService(logger, tokenProvider, directory);
}
