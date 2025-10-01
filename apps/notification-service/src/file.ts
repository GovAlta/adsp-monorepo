import { AdspId, adspId, assertAdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Attachment, FileAttachmentService } from './notification';
import axios from 'axios';
import { InvalidOperationError } from '@core-services/core-common';

class FileService implements FileAttachmentService {
  constructor(private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  async getAttachment(urn: AdspId): Promise<Attachment> {
    if (urn?.type !== 'resource' || urn?.namespace !== 'platform' || urn?.service !== 'file-service') {
      throw new InvalidOperationError(`Specified urn (${urn}) is not a file-service resource.`);
    }

    const fileUrl = await this.directory.getResourceUrl(urn);
    const token = await this.tokenProvider.getAccessToken();

    const { data } = await axios.get<{ filename: string; mimeType: string }>(fileUrl.href, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { data: content } = await axios.get(new URL(`${fileUrl}/download?unsafe=true`).href, {
      responseType: 'arraybuffer',
      headers: { Authorization: `Bearer ${token}` },
    });

    const base64Content = Buffer.from(content).toString('base64');

    return {
      filename: data.filename,
      content: base64Content,
      encoding: 'base64',
      contentType: data.mimeType,
    };
  }
}

export function createFileService(directory: ServiceDirectory, tokenProvider: TokenProvider): FileAttachmentService {
  return new FileService(directory, tokenProvider);
}
