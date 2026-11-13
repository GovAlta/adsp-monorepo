import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import axios, { isAxiosError } from 'axios';
import * as Handlebars from 'handlebars';
import type { Logger } from 'winston';
import z from 'zod';
import { describeTemplate, elideTemplate, restoreElided } from '../agents/pdf/templateView';
import { PdfDefinition, PdfDefinitionReader, PdfTemplateFields } from '../agents/pdf/types';
import { AdspRequestContext } from '../types';

// Reject invalid content before it is persisted; the pdf-service compiles these fields with
// Handlebars at generation time, so a bad save surfaces as a broken template for the user.
// The thrown message includes the parse error so the agent can correct and retry.
function validateTemplateInput(inputData: PdfTemplateFields, unknownPlaceholders: string[] = []): void {
  const issues: string[] = unknownPlaceholders.length
    ? [
        `${unknownPlaceholders.join(', ')} ${unknownPlaceholders.length > 1 ? 'do' : 'does'} not stand for anything in the saved template. Copy placeholders exactly as the current template shows them, or leave them out.`,
      ]
    : [];

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

/**
 * The template reads the variables as data, so variables wrapped in a "data" object leave every {{data.x}} empty.
 * Unwraps them, unless the template really reads a variable named data (data.data).
 */
export function unwrapDataVariables(
  variables: string | undefined,
  templates: Array<string | undefined>,
): string | undefined {
  let parsed: unknown;
  try {
    parsed = variables ? JSON.parse(variables) : undefined;
  } catch {
    return variables;
  }

  const isObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);
  const wrapped = isObject(parsed) && Object.keys(parsed).length === 1 && isObject(parsed.data);
  if (!wrapped || templates.some((template) => /\bdata\.data\b/.test(template ?? ''))) {
    return variables;
  }
  return JSON.stringify((parsed as { data: unknown }).data, null, 2);
}

type PdfRequestContext = AdspRequestContext<{ pdfDefinitionId: string }>;

/** Reads the saved definition of the PDF template in the request context from the configuration service. */
export function createPdfDefinitionReader({ directory, tokenProvider }: Omit<PdfConfigurationToolsProps, 'logger'>) {
  const read: PdfDefinitionReader = async (requestContext) => {
    const tenantId = requestContext.get('tenantId') as { toString(): string } | undefined;
    const pdfDefinitionId = requestContext.get('pdfDefinitionId') as string | undefined;
    if (!pdfDefinitionId) {
      return undefined;
    }

    const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
    const pdfDefinitionUrl = new URL(`v2/configuration/platform/pdf-service`, configurationServiceUrl);
    const { data } = await axios.get(pdfDefinitionUrl.href, {
      params: { tenantId: tenantId?.toString() },
      headers: {
        Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
      },
    });

    return data.latest?.configuration?.[pdfDefinitionId] as PdfDefinition | undefined;
  };
  return read;
}

export async function createPdfConfigurationTools({ directory, tokenProvider, logger }: PdfConfigurationToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
  const readDefinition = createPdfDefinitionReader({ directory, tokenProvider });

  const pdfConfigurationRetrievalTool = createTool({
    id: 'get-pdf-configuration',
    description: `Returns the current saved PDF template: template (HTML body), header, footer, additionalStyles (CSS) and variables (sample data JSON). Call it only when the current template is not shown in your instructions. The template comes from the request context; no input is needed.`,
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
    // The model reads the template like the one in its instructions: long data URIs and comments elided.
    toModelOutput: (output: PdfDefinition) => ({ type: 'text' as const, value: describeTemplate(output) }),
    execute: async (_, context) => {
      const requestContext = context.requestContext as PdfRequestContext | undefined;

      if (!requestContext) {
        throw new Error('Missing request context.');
      }
      const tenantId = requestContext.get('tenantId');
      const pdfDefinitionId = requestContext.get('pdfDefinitionId');

      try {
        const currentPdfDefinition = await readDefinition(requestContext);

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

  const pdfConfigurationUpdateTool = createTool({
    id: 'update-pdf-configuration',
    description: `Saves changes to the current PDF template. Pass only the fields to change, each complete; an omitted field keeps its saved value and an empty string clears it. Copy [[elided-...]] placeholders unchanged to keep their content. Invalid Handlebars or JSON is rejected without saving. The template comes from the request context.`,
    inputSchema: z.object({
      template: z.string().optional().describe('HTML template for PDF generation'),
      additionalStyles: z.string().optional().describe('Global CSS styles'),
      header: z.string().optional().describe('Header HTML/CSS'),
      footer: z.string().optional().describe('Footer HTML/CSS'),
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
    // The editor gets the saved template from the streamed result; the model only needs to know the save worked.
    toModelOutput: () => ({ type: 'text' as const, value: 'Saved. The editor now shows the updated template.' }),

    execute: async (inputData, context) => {
      const requestContext = context.requestContext as PdfRequestContext | undefined;

      if (!requestContext) {
        throw new Error('Missing request context.');
      }

      const pdfDefinitionId = requestContext.get('pdfDefinitionId');
      const tenantId = requestContext.get('tenantId');

      const currentPdfDefinition = (await readDefinition(requestContext)) as PdfDefinition & Record<string, unknown>;

      // The model edits the elided view of the saved template, so placeholders are put back before validation.
      const { template, variables, additionalStyles, header, footer } = inputData;
      const { fields: fieldUpdates, unknown } = restoreElided(
        { template, variables, additionalStyles, header, footer },
        elideTemplate(currentPdfDefinition).elided,
      );
      validateTemplateInput(fieldUpdates, unknown);

      // Compare against undefined so empty strings clear a field (e.g. replacing a
      // default header/footer or old CSS on full template replacement).
      for (const [field, value] of Object.entries(fieldUpdates)) {
        if (value !== undefined) {
          currentPdfDefinition[field] = value;
        }
      }
      if (fieldUpdates.variables !== undefined) {
        currentPdfDefinition.variables = unwrapDataVariables(currentPdfDefinition.variables, [
          currentPdfDefinition.template,
          currentPdfDefinition.header,
          currentPdfDefinition.footer,
        ]);
      }
      currentPdfDefinition.id = pdfDefinitionId;

      try {
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
