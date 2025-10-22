import { adspId, ServiceDirectory, Tenant, TokenProvider } from '@abgov/adsp-service-sdk';
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
      content: z.instanceof(ArrayBuffer),
    }),
    execute: async ({ context, runtimeContext }) => {
      const tenant = runtimeContext.get('tenant') as Tenant;
      const { fileId } = context;

      const fileDownloadUrl = new URL(`v1/files/${fileId}/download`, fileApiUrl);
      const { data } = await axios.get(fileDownloadUrl.href, {
        params: {
          tenantId: tenant?.id?.toString(),
        },
        headers: {
          Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
        },
        responseType: 'arraybuffer',
      });

      return { content: data };
    },
  });

  return { fileDownloadTool };
}

export type FileDownloadTool = Awaited<ReturnType<typeof createFileTools>>['fileDownloadTool'];
