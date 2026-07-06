import { z } from 'zod';
import { DocsRepository } from '../docs/docsRepository';
import { ToolDefinition } from './types';

const SearchArgs = z.object({
  query: z.string(),
  limit: z.number().int().min(1).max(20).optional(),
});

const ReadArgs = z.object({
  path: z.string(),
});

export function createDocsTools(docs: DocsRepository): ToolDefinition[] {
  return [
    {
      name: 'search_adsp_docs',
      description:
        'Search ADSP platform documentation (getting started, architecture, service concepts, and tutorials) by ' +
        'keyword. Returns matching pages with a snippet; use read_adsp_doc with the returned path to read the full page.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Keywords to search for, e.g. "send a domain event" or "directory service".',
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
        return { content: [{ type: 'text', text: JSON.stringify(docs.search(query, limit ?? 5), null, 2) }] };
      },
    },
    {
      name: 'read_adsp_doc',
      description: 'Return the full markdown content of an ADSP doc page by its path, as returned by search_adsp_docs.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Doc path, e.g. "services/event-service.md".',
          },
        },
        required: ['path'],
      },
      handler: (args) => {
        const { path } = ReadArgs.parse(args);
        const doc = docs.read(path);
        if (!doc) {
          return {
            isError: true,
            content: [
              { type: 'text', text: `No doc found at path "${path}". Use search_adsp_docs to find a valid path.` },
            ],
          };
        }

        return { content: [{ type: 'text', text: `# ${doc.title}\n\n${doc.content}` }] };
      },
    },
  ];
}
