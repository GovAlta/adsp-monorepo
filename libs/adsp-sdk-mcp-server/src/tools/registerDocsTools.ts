import { z } from 'zod';
import { DocsRepository } from '../docs/docsRepository';
import { queryTerms } from '../search/textSearch';
import { jsonText, buildNext, withRelatedAndNext } from './envelope';
import { LinkIndex } from './links';
import { OFFLINE_TOOL_ANNOTATIONS, ToolDefinition } from './types';

const SearchArgs = z.object({
  query: z.string(),
  limit: z.number().int().min(1).max(20).optional(),
});

const ListArgs = z.object({
  prefix: z.string().optional(),
});

const ReadArgs = z.object({
  path: z.string(),
});

// A prefix matching this few pages is specific enough to point straight at one.
const NARROW_PREFIX_PAGES = 5;

const definedOnly = (parsed: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== undefined));

export function createDocsTools(docs: DocsRepository, links: () => LinkIndex): ToolDefinition[] {
  return [
    {
      name: 'search_adsp_docs',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
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
        const parsed = SearchArgs.parse(args);
        const { query, limit } = parsed;
        if (queryTerms(query).length === 0) {
          return {
            content: [
              {
                type: 'text',
                text:
                  `"${query}" has only common words such as "how" or "the", so there is nothing to search for. ` +
                  'Use a service or feature name, e.g. "send a domain event", or call list_adsp_docs to browse.',
              },
            ],
          };
        }

        const results = docs.search(query, limit ?? 5);
        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No ADSP docs match "${query}". Try other keywords, or call list_adsp_docs to browse.`,
              },
            ],
          };
        }

        const index = links();
        const withRelated = results.map((result) =>
          withRelatedAndNext(result, index.relatedForDoc(result.path), undefined),
        );
        const top = withRelated[0];
        const next = buildNext(
          [
            {
              tool: 'read_adsp_doc',
              arguments: { path: top.path },
              why: 'Top match; read the full page.',
            },
            top.related?.serviceApis?.[0]
              ? {
                  tool: 'search_service_endpoints',
                  arguments: { query, service: top.related.serviceApis[0] },
                  why: "Find this service's REST endpoints for the same question.",
                }
              : undefined,
          ],
          { tool: 'search_adsp_docs', arguments: definedOnly(parsed) },
        );
        return jsonText(withRelatedAndNext({ results: withRelated }, undefined, next));
      },
    },
    {
      name: 'list_adsp_docs',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      description:
        'List the paths and titles of every bundled ADSP doc page, optionally only those under a path prefix ' +
        '(e.g. "services/" or "tutorials/"). Use it to browse what exists when keyword search misses; read a page ' +
        'with read_adsp_doc.',
      inputSchema: {
        type: 'object',
        properties: {
          prefix: {
            type: 'string',
            description: 'Only list doc paths that start with this, e.g. "services/".',
          },
        },
      },
      handler: (args) => {
        const parsed = ListArgs.parse(args);
        const { prefix } = parsed;
        const pages = docs.list().filter(({ path }) => !prefix || path.startsWith(prefix));
        if (pages.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No doc paths start with "${prefix}". Call list_adsp_docs without a prefix to see all.`,
              },
            ],
          };
        }

        const next =
          prefix && pages.length <= NARROW_PREFIX_PAGES
            ? buildNext(
                [
                  {
                    tool: 'read_adsp_doc',
                    arguments: { path: pages[0].path },
                    why:
                      pages.length === 1
                        ? 'Only page under this prefix; read it.'
                        : 'First page under this prefix; read it.',
                  },
                ],
                { tool: 'list_adsp_docs', arguments: definedOnly(parsed) },
              )
            : undefined;
        return jsonText(withRelatedAndNext({ results: pages }, undefined, next));
      },
    },
    {
      name: 'read_adsp_doc',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      description:
        'Return the full markdown content of an ADSP doc page by its path, as returned by search_adsp_docs or ' +
        'list_adsp_docs.',
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
        const parsed = ReadArgs.parse(args);
        const { path } = parsed;
        const doc = docs.read(path);
        if (!doc) {
          // clean-code-ignore: 2.18 — isError is the standard MCP CallToolResult field for a handled failure, not a hidden side effect.
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `No doc found at path "${path}". Use search_adsp_docs or list_adsp_docs to find a valid path.`,
              },
            ],
          };
        }

        const related = links().relatedForDoc(path);
        const next = buildNext(
          [
            related.serviceApis?.[0]
              ? {
                  tool: 'search_service_endpoints',
                  arguments: { query: doc.title, service: related.serviceApis[0] },
                  why: "Find this service's REST endpoints.",
                }
              : undefined,
            related.sdkSymbols?.[0]
              ? {
                  tool: 'search_sdk_reference',
                  arguments: { query: related.sdkSymbols[0] },
                  why: 'Look up the SDK symbol this page uses.',
                }
              : undefined,
            related.docs?.[0]
              ? { tool: 'read_adsp_doc', arguments: { path: related.docs[0] }, why: 'Read a page this one links to.' }
              : undefined,
          ],
          { tool: 'read_adsp_doc', arguments: definedOnly(parsed) },
        );
        return {
          content: [
            { type: 'text', text: `# ${doc.title}\n\n${doc.content}` },
            ...jsonText(withRelatedAndNext({ path }, related, next)).content,
          ],
        };
      },
    },
  ];
}
