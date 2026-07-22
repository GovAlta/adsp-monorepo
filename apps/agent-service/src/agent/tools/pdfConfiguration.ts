import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import axios, { isAxiosError } from 'axios';
import * as Handlebars from 'handlebars';
import type { Logger } from 'winston';
import z from 'zod';
import { AdspRequestContext } from '../types';

// Reject invalid content before it is persisted; the pdf-service compiles these fields with
// Handlebars at generation time, so a bad save surfaces as a broken template for the user.
// The thrown message includes the parse error so the agent can correct and retry.
function validateTemplateInput(inputData: {
  template?: string;
  header?: string;
  footer?: string;
  variables?: string;
}): void {
  const issues: string[] = [];

  const handlebarsFields: Array<[string, string | undefined]> = [
    ['template', inputData.template],
    ['header', inputData.header],
    ['footer', inputData.footer],
  ];
  for (const [field, value] of handlebarsFields) {
    if (value) {
      try {
        Handlebars.parse(value);
      } catch (err) {
        issues.push(`${field}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  if (inputData.variables) {
    try {
      JSON.parse(inputData.variables);
    } catch (err) {
      issues.push(`variables is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (issues.length > 0) {
    throw new Error(
      `Configuration was NOT saved. Fix the following syntax errors and call the tool again with ALL the fields from this attempt (fields omitted on the retry keep their previously saved values, so any other changes in this attempt would be silently lost):\n${issues.join('\n\n')}`,
    );
  }
}

interface PdfConfigurationToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export async function createPdfConfigurationTools({ directory, tokenProvider, logger }: PdfConfigurationToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);

  /**
   * RETRIEVE (unchanged)
   */
  const pdfConfigurationRetrievalTool = createTool({
    id: 'get-pdf-configuration',
    description:
     `
      Retrieve the current PDF template configuration for the PDF definition in the request context.

      This tool provides the complete existing template, including:
      - HTML body template
      - Header template
      - Footer template
      - CSS styles
      - Template variables (sample/test data)
      - Template metadata and settings

      Use this tool whenever you need to understand, review, analyze, troubleshoot, explain, modify, improve, or update a PDF template.

      IMPORTANT:
      - Call this tool before making any changes to a PDF template.
      - Call this tool before answering questions about the template structure or content.
      - Call this tool before updating headers, footers, styles, variables, or HTML.
      - The current configuration provides the required context for all template modifications.
      - Do not assume template contents. Retrieve the existing configuration first.

      No input is required. The PDF definition ID is automatically provided through request context.
      `,
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
    execute: async (_, context) => {
      const requestContext = context.requestContext as AdspRequestContext<{ pdfDefinitionId: string }> | undefined;

      if (!requestContext) {
        throw new Error('Missing request context.');
      }
      const tenantId = requestContext.get('tenantId');
      const pdfDefinitionId = requestContext.get('pdfDefinitionId');

      try {
        const pdfDefinitionUrl = new URL(`v2/configuration/platform/pdf-service`, configurationServiceUrl);

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
    description: `
      Save changes to the current PDF template configuration.

      Use this tool after reviewing the existing template configuration and making modifications to it.

      This tool writes updates back to the PDF configuration API and persists changes to:
      - HTML body template
      - Header template
      - Footer template
      - CSS styles
      - Template variables (sample/test data)
      - Template metadata and settings

      IMPORTANT:
      - Use get-pdf-configuration first to retrieve the current template.
      - Review the existing configuration before making changes.
      - Only update fields that were intentionally modified.
      - Use this tool whenever the user asks to save, apply, update, modify, fix, improve, or persist template changes.
      - Changes made by the assistant are not stored until this tool is called.
      - This tool is the final step in the template editing workflow and writes the updated configuration back to the API.

      The PDF definition ID is automatically provided through request context.
      Provide only the fields that should be changed.
      `,
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

    execute: async (inputData, context) => {
      const requestContext = context.requestContext as AdspRequestContext<{ pdfDefinitionId: string }> | undefined;

      if (!requestContext) {
        throw new Error('Missing request context.');
      }
      const { template, variables, additionalStyles, header, footer } = inputData;

      validateTemplateInput(inputData);

      const pdfDefinitionId = requestContext.get('pdfDefinitionId');
      const tenantId = requestContext.get('tenantId');

      const pdfDefinitionUrl = new URL(`v2/configuration/platform/pdf-service`, configurationServiceUrl);

      const { data } = await axios.get(pdfDefinitionUrl.href, {
        params: { tenantId: tenantId?.toString() },
        headers: {
          Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
        },
      });

      const currentPdfDefinition = data.latest.configuration[pdfDefinitionId];

      // Compare against undefined so empty strings clear a field (e.g. replacing a
      // default header/footer or old CSS on full template replacement).
      const fieldUpdates = { template, variables, additionalStyles, header, footer };
      for (const [field, value] of Object.entries(fieldUpdates)) {
        if (value !== undefined) {
          currentPdfDefinition[field] = value;
        }
      }
      currentPdfDefinition.id = pdfDefinitionId;

      try {
        const configurationServiceUrl = await directory.getServiceUrl(
          adspId`urn:ads:platform:configuration-service:v2`,
        );

        const pdfDefinitionUrl = new URL(`v2/configuration/platform/pdf-service`, configurationServiceUrl);

        const updatePayload = { [pdfDefinitionId]: { ...currentPdfDefinition } };

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
