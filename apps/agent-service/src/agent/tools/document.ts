import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import { createFileServiceClient } from '../clients';
import { AdspRequestContext } from '../types';
import { extractDocumentText, isExtractableDocument } from '../utils/documentParser';

interface DocumentToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export async function createDocumentTools({ directory, tokenProvider, logger }: DocumentToolsProps) {
  const fileServiceClient = createFileServiceClient({ logger, directory, tokenProvider });

  const documentExtractTool = createTool({
    id: 'extract-document',
    description:
      'Extracts text content from a PDF or DOCX file uploaded to the file service. ' +
      'Use this ONLY to read the textual content of a PDF or DOCX document. ' +
      'Do NOT use this for images (JPG, PNG, etc.) — uploaded images are already provided ' +
      'to you as visual content, so read them directly instead of calling this tool. ' +
      'For other non-PDF/DOCX text-based files, falls back to UTF-8 text decoding.',
    inputSchema: z.object({
      fileId: z
        .string()
        .describe(
          'UUID of the file. For file URN (urn:ads:platform:file-service:v1:/files/<id>), extract and pass only the UUID.',
        ),
    }),
    outputSchema: z.object({
      text: z.string().describe('Extracted text content of the document.'),
      filename: z.string().describe('Original filename of the document.'),
      mimeType: z.string().describe('MIME type of the document.'),
      pageCount: z.number().optional().describe('Number of pages (PDF only).'),
    }),
    execute: async (inputData, context: ToolExecutionContext) => {
      const requestContext = context.requestContext as AdspRequestContext;
      const tenantId = requestContext.get('tenantId');
      const { fileId } = inputData;

      const { data, metadata } = await fileServiceClient.getFileAndMetadata(
        tenantId,
        adspId`urn:ads:platform:file-service:v1:/files/${fileId}`,
      );

      logger.info(`Document downloaded for extraction: ${fileId} (${metadata.mimeType})`, {
        context: 'documentExtractTool',
        tenant: tenantId?.toString(),
      });

      // Images are provided to the model directly as visual content. UTF-8 decoding
      // raw image bytes produces binary garbage, so refuse and redirect to vision.
      if (metadata.mimeType?.startsWith('image/')) {
        return {
          text:
            `'${metadata.filename}' is an image (${metadata.mimeType}). It has already been provided to you ` +
            `as visual content — read it directly to extract its data or build the form. Do not call this tool for images.`,
          filename: metadata.filename,
          mimeType: metadata.mimeType,
        };
      }

      if (isExtractableDocument(metadata.mimeType, metadata.filename)) {
        const result = await extractDocumentText(data, metadata.mimeType, metadata.filename, logger);
        return {
          text: result.text,
          filename: metadata.filename,
          mimeType: metadata.mimeType,
          pageCount: result.pageCount,
        };
      }

      // Fallback: treat as UTF-8 text
      const decoder = new TextDecoder('utf-8');
      return {
        text: decoder.decode(data),
        filename: metadata.filename,
        mimeType: metadata.mimeType,
      };
    },
  });

  return { documentExtractTool };
}
