import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as FormData from 'form-data';
import { FileResult, FileService } from './pdf';

class PlatformFileService implements FileService {
  constructor(private tokenProvider: TokenProvider, private directory: ServiceDirectory) {}

  async upload(jobId: string, filename: string, content: Buffer): Promise<FileResult> {
    const formData = new FormData();
    formData.append('recordId', jobId);
    formData.append('filename', filename);
    formData.append('file', content);

    const fileServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:file-service`);
    const filesUrl = new URL('/file/v1/files', fileServiceUrl);
    const token = await this.tokenProvider.getAccessToken();

    const { data } = await axios.post<FileResult>(filesUrl.href, formData, {
      headers: { ...formData.getHeaders(), Authorization: `Bearer ${token}` },
    });

    return data;
  }
}

interface FileServiceProps {
  tokenProvider: TokenProvider;
  directory: ServiceDirectory;
}

export function createFileService({ tokenProvider, directory }: FileServiceProps): FileService {
  return new PlatformFileService(tokenProvider, directory);
}
