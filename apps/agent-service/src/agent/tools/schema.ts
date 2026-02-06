import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { createTool } from '@mastra/core/tools';
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
      url: z.string().describe(
        'URL of the schema definition file. URL fragment to specific definition is not supported.'
      ),
    }),
    outputSchema: z.object({
      jsonSchema: z.record(z.string(), z.unknown()),
    }),
    execute: async (input) => {
      return { jsonSchema: schemas[input.url] };
    },
  });
  return { schemaDefinitionTool };
}

export type SchemaDefinitionTool = Awaited<ReturnType<typeof createSchemaTools>>['schemaDefinitionTool'];
