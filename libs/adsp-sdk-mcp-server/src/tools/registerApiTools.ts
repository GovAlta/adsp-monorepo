import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ApiServiceSummary, ApiSpecsRepository } from '../api-specs/apiSpecsRepository';
import { queryTerms } from '../search/textSearch';
import { buildNext, definedOnly, jsonText, withRelatedAndNext } from './envelope';
import { LinkIndex, RELATED_CAP } from './links';
import { OFFLINE_TOOL_ANNOTATIONS, ToolDefinition } from './types';

const SearchArgs = z.object({
  query: z.string(),
  service: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

const ReadArgs = z.object({
  service: z.string(),
  method: z.string(),
  path: z.string(),
});

function text(value: string): CallToolResult {
  return { content: [{ type: 'text', text: value }] };
}

function toolError(message: string): CallToolResult {
  // clean-code-ignore: 2.18 — isError is the standard MCP CallToolResult field for a handled failure, not a hidden side effect.
  return { isError: true, content: [{ type: 'text', text: message }] };
}

export type EndpointQuery = (service: string, query: string) => string | undefined;

function findsEndpoints(apis: ApiSpecsRepository, query: string, service: ApiServiceSummary): boolean {
  return queryTerms(query).length > 0 && apis.search(query, { service, limit: 1 }).length > 0;
}

/**
 * The query a search_service_endpoints suggestion should carry: the given one when that search finds endpoints, else
 * the service's name when it does, else undefined.
 */
export function createEndpointQuery(loadApis: () => ApiSpecsRepository): EndpointQuery {
  return (serviceName, query) => {
    const apis = loadApis();
    const service = apis.findService(serviceName);
    return service && [query, service.name].find((candidate) => findsEndpoints(apis, candidate, service));
  };
}

function unknownService(name: string, apis: ApiSpecsRepository): CallToolResult {
  const known = apis
    .list()
    .map(({ app }) => app)
    .join(', ');
  return toolError(`No service API named "${name}". Use an app name or URN from list_service_apis: ${known}.`);
}

/**
 * Tools over the bundled OpenAPI specs. `loadApis` is called on first use, so the specs are only parsed when an
 * agent asks about an API.
 */
export function createApiTools(loadApis: () => ApiSpecsRepository, links: () => LinkIndex): ToolDefinition[] {
  const resolveService = (name: string): ApiServiceSummary | undefined => loadApis().findService(name);

  return [
    {
      name: 'list_service_apis',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      description:
        'List the ADSP services that publish a REST API, with each service URN and number of operations. Content ' +
        'comes from the OpenAPI specs each service serves at /swagger/docs/v1, bundled offline.',
      inputSchema: { type: 'object', properties: {} },
      handler: () =>
        jsonText({
          results: loadApis()
            .list()
            .map(({ app, urn, name, operations }) => ({ service: app, urn, name, operations })),
        }),
    },
    {
      name: 'search_service_endpoints',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      description:
        'Search ADSP service REST endpoints by keyword (path, summary, tags and description), optionally within one ' +
        'service. Returns method, path, summary and who may call it; use read_service_endpoint for parameters, ' +
        'request and response schemas.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keywords, e.g. "upload a file" or "send event".' },
          service: {
            type: 'string',
            description: 'Optional service app name or URN, e.g. "file-service" or "urn:ads:platform:file-service".',
          },
          limit: { type: 'number', description: 'Maximum number of results to return (default 10).' },
        },
        required: ['query'],
      },
      handler: (args) => {
        const parsed = SearchArgs.parse(args);
        const { query, service: serviceName, limit } = parsed;
        const service = serviceName === undefined ? undefined : resolveService(serviceName);
        if (serviceName !== undefined && !service) {
          return unknownService(serviceName, loadApis());
        }
        if (queryTerms(query).length === 0) {
          return text(
            `"${query}" has only common words such as "how" or "the", so there is nothing to search for. ` +
              'Use a resource or action, e.g. "upload a file", or call list_service_apis.',
          );
        }

        const results = loadApis().search(query, { service, limit });
        if (results.length === 0) {
          return text(`No endpoints match "${query}". Try other keywords, or call list_service_apis.`);
        }

        const index = links();
        const docs = [...new Set(results.flatMap((result) => index.docsForService(result.service)))].slice(
          0,
          RELATED_CAP,
        );
        const top = results[0];
        const next = buildNext(
          [
            {
              tool: 'read_service_endpoint',
              arguments: { service: top.service, method: top.method, path: top.path },
              why: "Read the top endpoint's parameters and schemas.",
            },
          ],
          { tool: 'search_service_endpoints', arguments: definedOnly(parsed) },
        );
        return jsonText(withRelatedAndNext({ results }, docs.length > 0 ? { docs } : undefined, next));
      },
    },
    {
      name: 'read_service_endpoint',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      description:
        "Read one ADSP REST endpoint as its service's OpenAPI spec defines it: description, who may call it, " +
        'parameters, request body and responses, with schema references inlined.',
      inputSchema: {
        type: 'object',
        properties: {
          service: { type: 'string', description: 'Service app name or URN, e.g. "file-service".' },
          method: { type: 'string', description: 'HTTP method, e.g. "POST".' },
          path: { type: 'string', description: 'Path as search_service_endpoints returns it, e.g. "/file/v1/files".' },
        },
        required: ['service', 'method', 'path'],
      },
      handler: (args) => {
        const parsed = ReadArgs.parse(args);
        const { service: serviceName, method, path } = parsed;
        const apis = loadApis();
        const service = resolveService(serviceName);
        if (!service) {
          return unknownService(serviceName, apis);
        }

        const endpoint = apis.read(service, method, path);
        if (!endpoint) {
          return toolError(
            `${service.app} has no ${method.toUpperCase()} ${path}. Its endpoints: ${apis.paths(service).join(', ')}.`,
          );
        }

        const docs = links().docsForService(service.app);
        const next = buildNext(
          [
            docs[0]
              ? { tool: 'read_adsp_doc', arguments: { path: docs[0] }, why: "Read this service's documentation." }
              : undefined,
          ],
          { tool: 'read_service_endpoint', arguments: definedOnly(parsed) },
        );
        return jsonText(withRelatedAndNext(endpoint, docs.length > 0 ? { docs } : undefined, next));
      },
    },
  ];
}
