import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { convertUint8ArrayToBase64, FilePart, ImagePart, TextPart } from '@ai-sdk/provider-utils-v5';
import type { CoreUserMessage } from '@mastra/core/llm';
import type { RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { BrokerInputProcessor } from '../types';
import { createFileServiceClient } from '../clients';
import { extractDocumentText, isExtractableDocument } from '../utils/documentParser';

const EXTRACTED_DIR = path.resolve('apps/agent-service/src/agent/processors/extracted');

export class FileServiceDownloadProcessor implements BrokerInputProcessor {
  readonly name = 'file-service-download-processor';
  private fileServiceClient: ReturnType<typeof createFileServiceClient>;

  constructor(
    private logger: Logger,
    directory: ServiceDirectory,
    tokenProvider: TokenProvider,
  ) {
    this.fileServiceClient = createFileServiceClient({ logger, directory, tokenProvider });
  }

  async processInput(
    requestContext: RequestContext<Record<string, unknown>>,
    input: CoreUserMessage | CoreUserMessage[],
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

  private async processContentData(
    tenantId: AdspId,
    content: Partial<FilePart> | ImagePart,
  ): Promise<Array<TextPart | FilePart | ImagePart>> {
    const data = content.type === 'file' ? content.data : content.image;
    if (typeof data === 'string' && AdspId.isAdspId(data)) {
      const resourceId = AdspId.parse(data);
      if (resourceId.type === 'resource' && resourceId.service === 'file-service') {
        const { rawData, mediaType, url, urn, filename } = await this.getFile(tenantId, resourceId);

        // For PDF/DOCX documents, extract text and send only text parts.
        // Most LLMs don't support binary document file parts (e.g. application/pdf),
        // so we replace the file part with extracted text content.
        const isExtractable = isExtractableDocument(mediaType, filename);
        this.writeDebug(
          filename,
          `[processor] File: ${filename}, MIME: ${mediaType}, isExtractable: ${isExtractable}, dataLen: ${rawData.length}`,
        );

        if (isExtractable) {
          try {
            this.writeDebug(filename, `[processor] Calling extractDocumentText...`);
            const extracted = await extractDocumentText(rawData, mediaType, filename, this.logger);
            this.writeDebug(
              filename,
              `[processor] extractDocumentText returned: text.length=${extracted?.text?.length || 0}, xfaForm=${extracted?.xfaForm}, pageCount=${extracted?.pageCount}`,
            );

            if (extracted?.text) {
              // Write extracted text to file for debugging
              this.writeExtractedText(filename, extracted.text);

              const prefix = extracted.xfaForm
                ? `Provided document '${filename}' (file service URN: ${urn}) is an XFA-based PDF form (created with Adobe LiveCycle Designer). The form structure was extracted from the embedded XML:`
                : `Provided document has filename '${filename}' and file service URN of: ${urn}`;

              return [
                { type: 'text', text: prefix },
                { type: 'text', text: `Extracted text content from '${filename}':\n\n${extracted.text}` },
              ];
            }

            // XFA form detected but no content could be extracted
            if (extracted?.xfaForm) {
              this.writeDebug(filename, `[processor] XFA detected but no text extracted, returning fallback message`);
              return [
                {
                  type: 'text',
                  text: `Provided document '${filename}' (file service URN: ${urn}) is an XFA-based PDF form (created with Adobe LiveCycle Designer). The form content could not be extracted automatically. Please ask the user to describe the form fields, or provide a DOCX/standard PDF version of the form requirements instead.`,
                },
              ];
            }

            this.writeDebug(
              filename,
              `[processor] extraction returned null or non-XFA with empty text, falling through to binary`,
            );
          } catch (err) {
            this.writeDebug(filename, `[processor] EXCEPTION in extractDocumentText: ${err.message}\n${err.stack}`);
            this.logger.warn(`Failed to extract text from document '${filename}': ${err.message}`, {
              context: 'FileServiceDownloadProcessor',
              tenant: tenantId?.toString(),
            });
            // Fall through to send as file part if extraction fails
          }
        }

        // For images and non-extractable files, send the base64 data as before.
        return [
          content.type === 'file'
            ? { type: 'file', data: url, mediaType, filename }
            : { type: 'image', image: url, mediaType },
          { type: 'text', text: `Provided file or image has filename '${filename}' and file service URN of: ${urn}` },
        ];
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
      rawData: data,
      url: `data:${metadata.mimeType};base64,${imageStr}`,
      mediaType: metadata.mimeType,
      filename: metadata.filename,
      urn: metadata.urn,
    };
  }

  private writeExtractedText(originalFilename: string, text: string): void {
    try {
      fs.mkdirSync(EXTRACTED_DIR, { recursive: true });
      const baseName = path.parse(originalFilename).name;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputPath = path.join(EXTRACTED_DIR, `${baseName}_${timestamp}.txt`);
      fs.writeFileSync(outputPath, text, 'utf-8');
      this.logger.info(`Extracted text written to: ${outputPath}`, {
        context: 'FileServiceDownloadProcessor',
      });
    } catch (err) {
      this.logger.warn(`Failed to write extracted text for '${originalFilename}': ${err.message}`, {
        context: 'FileServiceDownloadProcessor',
      });
    }
  }

  private writeDebug(originalFilename: string, message: string): void {
    try {
      fs.mkdirSync(EXTRACTED_DIR, { recursive: true });
      const baseName = path.parse(originalFilename || 'unknown').name;
      const debugPath = path.join(EXTRACTED_DIR, `${baseName}_processor-debug.log`);
      const line = `[${new Date().toISOString()}] ${message}\n`;
      fs.appendFileSync(debugPath, line, 'utf-8');
    } catch {
      // ignore debug write errors
    }
  }
}
