import { AdspId, adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core';
import axios from 'axios';
import type { Logger } from 'winston';
import z from 'zod';

interface FileToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export async function createFileTools({ directory, tokenProvider, logger }: FileToolsProps) {
  const fileApiUrl = await directory.getServiceUrl(adspId`urn:ads:platform:file-service:v1`);

  const fileDownloadTool = createTool({
    id: 'download-file',
    description: 'Downloads a file from the file service based on a file ID.',
    inputSchema: z.object({
      fileId: z.string(),
    }),
    outputSchema: z.object({
      type: z.string(),
      data: z.instanceof(Uint8Array),
      mediaType: z.string(),
    }),
    execute: async ({ context, runtimeContext }) => {
      const tenantId = runtimeContext.get('tenantId') as AdspId;
      const { fileId } = context;

      const fileUrl = new URL(`v1/files/${fileId}`, fileApiUrl);
      const { data: metadata } = await axios.get(fileUrl.href, {
        params: {
          tenantId: tenantId?.toString(),
        },
        headers: {
          Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
        },
      });

      const fileDownloadUrl = new URL(`v1/files/${fileId}/download`, fileApiUrl);
      const { data } = await axios.get(fileDownloadUrl.href, {
        params: {
          tenantId: tenantId?.toString(),
        },
        headers: {
          Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
        },
        responseType: 'arraybuffer',
      });

      logger.info(`File downloaded by agent: ${fileId}`, {
        context: 'fileDownloadTool',
        tenant: tenantId?.toString(),
      });

      return {
        data: new Uint8Array(data),
        mediaType: metadata.mimeType,
      };
    },
  });

  return { fileDownloadTool };
}

export type FileDownloadTool = Awaited<ReturnType<typeof createFileTools>>['fileDownloadTool'];
