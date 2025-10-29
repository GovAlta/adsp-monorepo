import { AdspId, adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core';
import axios from 'axios';
import type { Logger } from 'winston';
import z from 'zod';
import { createFileServiceClient } from '../clients';

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
      fileId: z.string(),
    }),
    outputSchema: z.object({
      content: z.string(),
    }),
    execute: async ({ context, runtimeContext }) => {
      const tenantId = runtimeContext.get('tenantId') as AdspId;
      const { fileId } = context;

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

  return { fileDownloadTool };
}

export type FileDownloadTool = Awaited<ReturnType<typeof createFileTools>>['fileDownloadTool'];
