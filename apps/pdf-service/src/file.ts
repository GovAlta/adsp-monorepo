import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as FormData from 'form-data';
import { Logger } from 'winston';
import { FileResult, FileService, GENERATED_PDF } from './pdf';

class PlatformFileService implements FileService {
  constructor(private logger: Logger, private tokenProvider: TokenProvider, private directory: ServiceDirectory) {}

  async upload(jobId: string, filename: string, content: Buffer): Promise<FileResult> {
    try {
      const formData = new FormData();
      formData.append('type', GENERATED_PDF);
      formData.append('recordId', jobId);
      formData.append('filename', filename);
      formData.append('file', content, filename);

      const fileServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:file-service`);
      const filesUrl = new URL('/file/v1/files', fileServiceUrl);
      const token = await this.tokenProvider.getAccessToken();

      const { data } = await axios.post<FileResult>(filesUrl.href, formData, {
        headers: { ...formData.getHeaders(), Authorization: `Bearer ${token}` },
      });

      return data;
    } catch (err) {
      this.logger.debug(`Upload to file service failed with error. ${axios.isAxiosError(err) ? err.toJSON() : err}`, {
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
