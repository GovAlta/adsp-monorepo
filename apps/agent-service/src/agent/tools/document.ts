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
      'Use this when you need to read the textual content of a document. ' +
      'For non-PDF/DOCX files, falls back to UTF-8 text decoding.',
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
