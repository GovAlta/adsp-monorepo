import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import { AdspRequestContext } from '../types';
import { getLatestFormDefinition, validateFormSchemas } from '../agents/forms/schema';

interface SchemaValidateToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

const validationOutputSchema = z.object({
  ok: z.boolean(),
  errors: z.array(
    z.object({
      path: z.string(),
      message: z.string(),
    }),
  ),
  counts: z.object({
    propertyCount: z.number(),
    categoryCount: z.number(),
    controlCount: z.number(),
  }),
});

export async function createSchemaValidateTools({ directory, tokenProvider, logger }: SchemaValidateToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
  const client = { configurationServiceUrl, tokenProvider };

  const formSchemaValidate = createTool({
    id: 'validate-form-schema',
    description: `Validate the saved form definition (GET latest). Checks JSON Schema draft-07, Control/rule scopes, and SHOW/HIDE fields that are top-level required without a matching if/then. Does not write.`,
    inputSchema: z.object({}),
    outputSchema: validationOutputSchema,
    execute: async (_, context: ToolExecutionContext) => {
      const requestContext = context.requestContext as AdspRequestContext<{ formDefinitionId: string }>;
      const tenantId = requestContext.get('tenantId')?.toString();
      const formDefinitionId = requestContext.get('formDefinitionId');
      const latest = await getLatestFormDefinition(client, tenantId, formDefinitionId);
      const result = validateFormSchemas(latest.dataSchema, latest.uiSchema);

      logger.info(
        `Validated form definition ${formDefinitionId}: ok=${result.ok}, errors=${result.errors.length}.`,
        { context: 'formSchemaValidate', tenant: tenantId, formDefinitionId },
      );

      return result;
    },
  });

  return { formSchemaValidate };
}

export type FormSchemaValidate = Awaited<ReturnType<typeof createSchemaValidateTools>>['formSchemaValidate'];
