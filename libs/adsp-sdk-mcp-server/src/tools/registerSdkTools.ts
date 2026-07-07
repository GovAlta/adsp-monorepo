import { z } from 'zod';
import { searchSdkReference } from '../sdk-reference/search';
import { ToolDefinition } from './types';

const SearchArgs = z.object({
  query: z.string(),
  limit: z.number().int().min(1).max(20).optional(),
});

export function createSdkTools(): ToolDefinition[] {
  return [
    {
      name: 'search_sdk_reference',
      description:
        'Search the @abgov/adsp-service-sdk (Node SDK) reference by symbol name, module, or keyword. Returns full ' +
        'symbol details: kind, module, description, option/return shape, example, and deprecated flag.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Symbol name or keyword, e.g. "initializePlatform", "send event", or "directory".',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default 5).',
          },
        },
        required: ['query'],
      },
      handler: (args) => {
        const { query, limit } = SearchArgs.parse(args);
        const results = searchSdkReference(query, limit ?? 5);
        if (results.length === 0) {
          return {
            content: [{ type: 'text', text: `No matching @abgov/adsp-service-sdk symbols found for "${query}".` }],
          };
        }

        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      },
    },
  ];
}
