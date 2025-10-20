import { createTool } from '@mastra/core';
import axios from 'axios';
import * as z from 'zod';

export async function createSchemaTools() {
  const schemaDefinitionTool = createTool({
    id: 'get-schema-definition',
    description: 'Get the JSON schema definitions for common fields like email, full name, and address.',
    inputSchema: z.object({
      url: z.string().describe('URL of the schema'),
    }),
    outputSchema: z.object({
      jsonSchema: z.object({}),
    }),
    execute: async ({ context }) => {
      const { data } = await axios.get(context.url);
      return { jsonSchema: data };
    },
  });
  return { schemaDefinitionTool };
}
