import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import axios, { isAxiosError } from 'axios';
import type { Logger } from 'winston';
import z from 'zod';
import { AdspRequestContext } from '../types';

interface PdfConfigurationToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export async function createPdfConfigurationTools({
  directory,
  tokenProvider,
  logger,
}: PdfConfigurationToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(
    adspId`urn:ads:platform:configuration-service:v2`,
  );

  /**
   * RETRIEVE (unchanged)
   */
  const pdfConfigurationRetrievalTool = createTool({
    id: 'get-pdf-configuration',
    description:
      'Retrieve the JSON PDF configuration. The PDF definition ID comes from request context (no input required).',
    inputSchema: z.object({}),
    outputSchema: z.object({
      name: z.string(),
      description: z.string(),

      template: z.string().optional(),
      startWithDefault: z.boolean().optional(),
      additionalStyles: z.string().optional(),
      header: z.string().optional(),
      footer: z.string().optional(),
      variables: z.string().optional(),
    }),
    execute: async (
      _,
      { requestContext }: { requestContext: AdspRequestContext<{ pdfDefinitionId: string }> },
    ) => {
      const tenantId = requestContext.get('tenantId');
      const pdfDefinitionId = requestContext.get('pdfDefinitionId');

      try {
        const pdfDefinitionUrl = new URL(
          `v2/configuration/platform/pdf-service`,
          configurationServiceUrl,
        );

        const { data } = await axios.get(pdfDefinitionUrl.href, {
          params: { tenantId: tenantId?.toString() },
          headers: {
            Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
          },
        });

        const currentPdfDefinition = data.latest.configuration[pdfDefinitionId];

        logger.info(`PDF configuration retrieved successfully`, {
          context: 'pdfConfigurationRetrievalTool',
          tenant: tenantId?.toString(),
          pdfDefinitionId,
        });

        return currentPdfDefinition;
      } catch (err) {
        logger.error(`PDF configuration retrieval failed`, {
          context: 'pdfConfigurationRetrievalTool',
          tenant: tenantId?.toString(),
          pdfDefinitionId,
          error: isAxiosError(err)
            ? {
                status: err.response?.status,
                data: err.response?.data,
              }
            : String(err),
        });

        throw new Error(`Failed to retrieve PDF configuration`);
      }
    },
  });

  /**
   * UPDATE (UPDATED INPUT SHAPE)
   */
  const pdfConfigurationUpdateTool = createTool({
    id: 'update-pdf-configuration',
    description:
      'Update the JSON PDF configuration template and related settings.',
    inputSchema: z.object({
      name: z.string().optional(),
      description: z.string().optional(),

      template: z.string().optional().describe('HTML template for PDF generation'),
      startWithDefault: z.boolean().optional().describe('Whether to start from default template'),
      additionalStyles: z.string().optional().describe('Global CSS styles'),
      header: z.string().optional().describe('Header HTML/CSS'),
      footer: z.string().optional().describe('Footer HTML/CSS'),

      // JSON string as provided in your example
      variables: z.string().optional().describe('JSON string of template variables'),
    }),

    outputSchema: z.object({
      name: z.string(),
      description: z.string(),
      id: z.string(),
      template: z.string().optional(),
      startWithDefault: z.boolean().optional(),
      additionalStyles: z.string().optional(),
      header: z.string().optional(),
      footer: z.string().optional(),
      variables: z.string().optional(),
    }),

    execute: async (
      inputData,
      { requestContext }: { requestContext: AdspRequestContext<{ pdfDefinitionId: string }> },
    ) => {
      const {

        template,
        variables,
        additionalStyles,
        header,
        footer,

      } = inputData;

      const pdfDefinitionId = requestContext.get('pdfDefinitionId');
      const tenantId = requestContext.get('tenantId');

      const pdfDefinitionUrl = new URL(
        `v2/configuration/platform/pdf-service`,
        configurationServiceUrl,
      );

        const { data } = await axios.get(pdfDefinitionUrl.href, {
            params: { tenantId: tenantId?.toString() },
          headers: {
            Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
          },
        });

      const currentPdfDefinition = data.latest.configuration[pdfDefinitionId];

      if (template) currentPdfDefinition.template = template;
      if (variables) currentPdfDefinition.variables = variables;
      if (additionalStyles) currentPdfDefinition.additionalStyles = additionalStyles;
      if (header) currentPdfDefinition.header = header;
      if (footer) currentPdfDefinition.footer = footer;
      currentPdfDefinition.id = pdfDefinitionId;

      try {
        const configurationServiceUrl = await directory.getServiceUrl(
          adspId`urn:ads:platform:configuration-service:v2`,
        );

        const pdfDefinitionUrl = new URL(
          `v2/configuration/platform/pdf-service`,
          configurationServiceUrl,
        );

        const updatePayload = {[pdfDefinitionId]: {...currentPdfDefinition}};

        const { data, status } = await axios.patch(
          pdfDefinitionUrl.href,
          {
            operation: 'UPDATE',
            update: updatePayload,
          },
          {
            params: {
              tenantId: tenantId?.toString(),
            },
            headers: {
              Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
            },
          },
        );

        logger.info(`PDF configuration updated successfully`, {
          context: 'pdfConfigurationUpdateTool',
          status,
          tenant: tenantId?.toString(),
          pdfDefinitionId,
          updatedFields: Object.keys(inputData).filter((k) => inputData[k] !== undefined),
        });

        return data.latest.configuration[pdfDefinitionId];
      } catch (err) {
        logger.error(`PDF configuration update failed`, {
          context: 'pdfConfigurationUpdateTool',
          tenant: tenantId?.toString(),
          pdfDefinitionId,
          error: isAxiosError(err)
            ? {
                status: err.response?.status,
                data: err.response?.data,
              }
            : String(err),
        });

        throw new Error(`Failed to update PDF configuration`);
      }
    },
  });

  return { pdfConfigurationRetrievalTool, pdfConfigurationUpdateTool };
}

export type PdfConfigurationRetrievalTool = Awaited<
  ReturnType<typeof createPdfConfigurationTools>
>['pdfConfigurationRetrievalTool'];

export type PdfConfigurationUpdateTool = Awaited<
  ReturnType<typeof createPdfConfigurationTools>
>['pdfConfigurationUpdateTool'];