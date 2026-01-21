import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { createTool } from '@mastra/core';
import * as z from 'zod';

export async function createSchemaTools() {
  const schemas = {
    [standardV1JsonSchema.$id]: standardV1JsonSchema,
    [commonV1JsonSchema.$id]: commonV1JsonSchema,
  };
  const schemaDefinitionTool = createTool({
    id: 'get-schema-definition',
    description: 'Get the JSON schema definitions for common fields like email, full name, and address.',
    inputSchema: z.object({
      url: z.string().describe('URL of the schema definition file'),
    }),
    outputSchema: z.object({
      jsonSchema: z.object({}),
    }),
    execute: async ({ context }) => {
      return { jsonSchema: schemas[context.url] };
    },
  });
  return { schemaDefinitionTool };
}

export type SchemaDefinitionTool = Awaited<ReturnType<typeof createSchemaTools>>['schemaDefinitionTool'];
