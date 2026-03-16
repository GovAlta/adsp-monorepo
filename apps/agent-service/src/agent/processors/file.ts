import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { convertUint8ArrayToBase64, FilePart, ImagePart, TextPart } from '@ai-sdk/provider-utils-v5';
import type { CoreUserMessage } from '@mastra/core/llm';
import type { RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import { BrokerInputProcessor } from '../types';
import { createFileServiceClient } from '../clients';

export class FileServiceDownloadProcessor implements BrokerInputProcessor {
  readonly name = 'file-service-download-processor';
  private fileServiceClient: ReturnType<typeof createFileServiceClient>;

  constructor(private logger: Logger, directory: ServiceDirectory, tokenProvider: TokenProvider) {
    this.fileServiceClient = createFileServiceClient({ logger, directory, tokenProvider });
  }

  async processInput(
    requestContext: RequestContext<Record<string, unknown>>,
    input: CoreUserMessage | CoreUserMessage[]
  ): Promise<CoreUserMessage | CoreUserMessage[]> {
    const tenantId = requestContext.get<'tenantId', AdspId>('tenantId');

    const messages = Array.isArray(input) ? input : [input];
    for (const message of messages) {
      if (Array.isArray(message.content)) {
        const processed = [];
        for (const content of message.content) {
          switch (content.type) {
            case 'file':
            case 'image': {
              const updated = await this.processContentData(tenantId, content);
              if (updated) {
                processed.push(...updated);
              }
              break;
            }
            default:
              processed.push(content);
              break;
          }
        }
        message.content = processed;
      }
    }

    return input;
  }

  private async processContentData(tenantId: AdspId, content: Partial<FilePart> | ImagePart): Promise<Array<TextPart | FilePart | ImagePart>> {
    const data = content.type === 'file' ? content.data : content.image;
    if (typeof data === 'string' && AdspId.isAdspId(data)) {
      const resourceId = AdspId.parse(data);
      if (resourceId.type === 'resource' && resourceId.service === 'file-service') {
        const { mediaType, url, urn, filename } = await this.getFile(tenantId, resourceId);
        return [content.type === 'file'
          ? { type: 'file', data: url, mediaType, filename }
          : { type: 'image', image: url, mediaType },
        { type: 'text', text: `Provided file or image has filename '${filename}' and file service URN of: ${urn}` }];
      }
    }
    return;
  }

  private async getFile(tenantId: AdspId, resourceId: AdspId) {
    const { data, metadata } = await this.fileServiceClient.getFileAndMetadata(tenantId, resourceId);

    this.logger.info(`File downloaded by agent: ${resourceId}`, {
      context: 'fileDownloadTool',
      tenant: tenantId?.toString(),
    });

    const imageStr = convertUint8ArrayToBase64(data);
    return {
      url: `data:${metadata.mimeType};base64,${imageStr}`,
      mediaType: metadata.mimeType,
      filename: metadata.filename,
      urn: metadata.urn,
    };
  }
}
