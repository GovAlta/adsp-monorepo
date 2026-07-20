import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { convertUint8ArrayToBase64, FilePart, ImagePart, TextPart } from '@ai-sdk/provider-utils-v5';
import type { CoreUserMessage } from '@mastra/core/llm';
import type { RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import { BrokerInputProcessor } from '../types';
import { createFileServiceClient, FileTypeInfo } from '../clients';
import { extractDocumentText, ExtractedImage, isExtractableDocument } from '../utils/documentParser';

// Rendered on its own line so no punctuation is adjacent to the URN token that precedes it.
function formatStorageNote(typeInfo: FileTypeInfo | null): string {
  if (!typeInfo) {
    return '';
  }
  const access = typeInfo.anonymousRead ? 'anonymous read allowed' : 'no anonymous read';
  const retention = !typeInfo.retentionActive
    ? 'no auto-delete'
    : typeInfo.retentionDays
      ? `auto-deletes after ${typeInfo.retentionDays} days`
      : 'auto-deletes per a retention policy';
  return `\nThe file is stored in file type '${typeInfo.name}' (${access}; ${retention}).`;
}

function pushLabeledImageParts(
  parts: Array<TextPart | FilePart | ImagePart>,
  images: ExtractedImage[],
  label: string,
): void {
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    parts.push({ type: 'text', text: `${label} ${i + 1}:` });
    // SDK declares ImagePart.image as URL but accepts data URI strings at runtime; cast is intentional.
    parts.push({
      type: 'image',
      image: `data:${image.mimeType};base64,${image.data}` as unknown as URL,
      mediaType: image.mimeType,
    });
  }
}

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

  private async processContentData(tenantId: AdspId, content: Partial<FilePart> | ImagePart): Promise<Array<TextPart | FilePart | ImagePart> | undefined> {
    const data = content.type === 'file' ? content.data : content.image;
    if (typeof data === 'string' && AdspId.isAdspId(data)) {
      const resourceId = AdspId.parse(data);
      if (resourceId.type === 'resource' && resourceId.service === 'file-service') {
        const { rawData, mediaType, url, urn, filename, typeName } = await this.getFile(tenantId, resourceId);

        // Storage details let the agent warn the user when a file's type cannot render in
        // generated PDFs (no anonymous read) or will be auto-deleted by a retention rule.
        // Started here so the lookup runs concurrently with document extraction below.
        const typeInfoPromise = typeName
          ? this.fileServiceClient.getFileTypeInfo(tenantId, typeName)
          : Promise.resolve(null);

        // For PDF/DOCX documents, extract text and send only text parts.
        // Most LLMs don't support binary document file parts (e.g. application/pdf),
        // so we replace the file part with extracted text content.
        const isExtractable = isExtractableDocument(mediaType, filename);

        if (isExtractable) {
          try {
            const extracted = await extractDocumentText(rawData, mediaType, filename, this.logger);
            const storageNote = formatStorageNote(await typeInfoPromise);

            if (extracted?.text) {
              const prefix = extracted.xfaForm
                ? `Provided document '${filename}' (file service URN: ${urn}) is an XFA-based PDF form (created with Adobe LiveCycle Designer). The form structure was extracted from the embedded XML:${storageNote}`
                : `Provided document has filename '${filename}' and file service URN of: ${urn}${storageNote}`;

              const contentLabel = extracted.format === 'html' ? 'Extracted HTML content' : 'Extracted text content';

              const parts: Array<TextPart | FilePart | ImagePart> = [
                { type: 'text', text: prefix },
                { type: 'text', text: `${contentLabel} from '${filename}':\n\n${extracted.text}` },
              ];

              if (extracted.images?.length) {
                parts.push({
                  type: 'text',
                  text: `The document contains ${extracted.images.length} embedded diagram(s). Each [DIAGRAM_N] marker in the HTML above shows where diagram N appears in the document. Reproduce each diagram in HTML/CSS at its marker position. The diagrams are provided as vision images below:`,
                });
                pushLabeledImageParts(parts, extracted.images, 'Diagram');
              }

              if (extracted.pageImages?.length) {
                const totalPages = extracted.pageCount ?? extracted.pageImages.length;
                const coverageNote =
                  totalPages > extracted.pageImages.length
                    ? ` (first ${extracted.pageImages.length} of ${totalPages} pages; describe to the user that remaining pages were not rendered)`
                    : '';
                parts.push({
                  type: 'text',
                  text: `Full-page visual renders of the document${coverageNote} are provided below. Use them as the visual design reference for page orientation, margins, columns, layout regions, colors, fonts, field placement, and logos. Use the extracted text above for accurate text content:`,
                });
                pushLabeledImageParts(parts, extracted.pageImages, 'Page');
              }

              return parts;
            }

            // XFA form detected but no content could be extracted
            if (extracted?.xfaForm) {
              return [
                {
                  type: 'text',
                  text: `Provided document '${filename}' (file service URN: ${urn}) is an XFA-based PDF form (created with Adobe LiveCycle Designer). The form content could not be extracted automatically. Please ask the user to describe the form fields, or provide a DOCX/standard PDF version of the form requirements instead.`,
                },
              ];
            }
          } catch (err) {
            this.logger.warn(`Failed to extract text from document '${filename}': ${err instanceof Error ? err.message : String(err)}`, {
              context: 'FileServiceDownloadProcessor',
              tenant: tenantId?.toString(),
            });
            // Fall through to send as file part if extraction fails
          }
        }

        // For images and non-extractable files, send the base64 data as before.
        const storageNote = formatStorageNote(await typeInfoPromise);
        return [
          content.type === 'file'
            ? { type: 'file', data: url, mediaType, filename }
            : { type: 'image', image: url, mediaType },
          {
            type: 'text',
            text: `Provided file or image has filename '${filename}' and file service URN of: ${urn}${storageNote}`,
          },
        ];
      }
    }
    return;
  }

  private async getFile(tenantId: AdspId, resourceId: AdspId) {
    const { data, metadata } = await this.fileServiceClient.getFileAndMetadata(tenantId, resourceId);

    this.logger.info(`File downloaded by agent: ${resourceId}`, {
      context: 'FileServiceDownloadProcessor',
      tenant: tenantId?.toString(),
    });

    const imageStr = convertUint8ArrayToBase64(data);
    return {
      rawData: data,
      url: `data:${metadata.mimeType};base64,${imageStr}`,
      mediaType: metadata.mimeType,
      filename: metadata.filename,
      urn: metadata.urn,
      typeName: metadata.typeName,
    };
  }
}
