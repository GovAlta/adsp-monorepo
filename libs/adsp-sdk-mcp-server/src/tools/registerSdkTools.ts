import { z } from 'zod';
import { searchSdkReference } from '../sdk-reference/search';
import { buildNext, definedOnly, jsonText, withRelatedAndNext } from './envelope';
import { LinkIndex } from './links';
import { OFFLINE_TOOL_ANNOTATIONS, ToolDefinition } from './types';

const SearchArgs = z.object({
  query: z.string(),
  limit: z.number().int().min(1).max(20).optional(),
});

export function createSdkTools(links: () => LinkIndex): ToolDefinition[] {
  return [
    {
      name: 'search_sdk_reference',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
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
        const parsed = SearchArgs.parse(args);
        const { query, limit } = parsed;
        const results = searchSdkReference(query, limit ?? 5);
        if (results.length === 0) {
          return {
            content: [{ type: 'text', text: `No matching @abgov/adsp-service-sdk symbols found for "${query}".` }],
          };
        }

        const index = links();
        const withRelated = results.map((symbol) =>
          withRelatedAndNext(symbol, index.relatedForSymbol(symbol.name), undefined),
        );
        const topRelated = withRelated[0].related;
        const next = buildNext(
          [
            topRelated?.docs?.[0]
              ? {
                  tool: 'read_adsp_doc',
                  arguments: { path: topRelated.docs[0] },
                  why: 'Read a page that uses this symbol.',
                }
              : undefined,
            topRelated?.sdkSymbols?.[0]
              ? {
                  tool: 'search_sdk_reference',
                  arguments: { query: topRelated.sdkSymbols[0] },
                  why: 'Look up a related SDK symbol.',
                }
              : undefined,
          ],
          { tool: 'search_sdk_reference', arguments: definedOnly(parsed) },
        );
        return jsonText(withRelatedAndNext({ results: withRelated }, undefined, next));
      },
    },
  ];
}
