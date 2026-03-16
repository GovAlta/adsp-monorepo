import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import { createFileServiceClient } from '../clients';
import { AdspRequestContext} from '../types';

interface FileToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export async function createFileTools({ directory, tokenProvider, logger }: FileToolsProps) {
  const fileServiceClient = createFileServiceClient({ logger, directory, tokenProvider });

  // Note that this tool only works for text content.
  const fileDownloadTool = createTool({
    id: 'download-file',
    description: 'Downloads a file from the file service based on a file ID.',
    inputSchema: z.object({
      fileId: z.string().describe('UUID of the file. For file URN (urn:ads:platform:file-service:v1:/files/<id>), extract and pass only the UUID.'),
    }),
    outputSchema: z.object({
      content: z.string(),
    }),
    execute: async (inputData, { requestContext }: {requestContext: AdspRequestContext}) => {
      const tenantId = requestContext.get('tenantId');
      const { fileId } = inputData;

      const { data } = await fileServiceClient.getFileAndMetadata(
        tenantId,
        adspId`urn:ads:platform:file-service:v1:/files/${fileId}`
      );

      logger.info(`File downloaded by agent: ${fileId}`, {
        context: 'fileDownloadTool',
        tenant: tenantId?.toString(),
      });

      const decoder = new TextDecoder('utf-8');
      return {
        content: decoder.decode(data),
      };
    },
  });

  const fileCopyTool = createTool({
    id: 'copy-file',
    description: 'Creates a copy of a file in file service and optionally changes the filename, file type, and recordId.',
    inputSchema: z.object({
      fileId: z.string().describe('UUID of the file. For file URN (urn:ads:platform:file-service:v1:/files/<id>), extract and pass only the UUID.'),
      filename: z.string().optional().describe('Filename for the copy. Filename of the original file is used if no value provided.'),
      type: z.string().optional().describe('File type for the copy. Type of the original file is used if no value provided.'),
      recordId: z.string().optional().describe('Record ID associated with the copy. Record ID of the original file is used if no value provided.'),
    }),
    outputSchema: z.object({
      urn: z.string(),
      filename: z.string(),
      mimeType: z.string(),
    }),
    execute: async (inputData, { requestContext }: {requestContext: AdspRequestContext}) => {
      const tenantId = requestContext.get('tenantId');
      const user = requestContext.get('user');

      const { fileId, filename, type, recordId } = inputData;

      const result = await fileServiceClient.copyFile(
        tenantId,
        adspId`urn:ads:platform:file-service:v1:/files/${fileId}`,
        user.token.bearer,
        filename,
        type,
        recordId
      );

      logger.info(`File (ID: ${fileId}) copied by agent to: ${result.urn}`, {
        context: 'fileDownloadTool',
        tenant: tenantId?.toString(),
      });

      return result;
    },
  });

  return { fileDownloadTool, fileCopyTool };
}

export type FileDownloadTool = Awaited<ReturnType<typeof createFileTools>>['fileDownloadTool'];
