import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ApiServiceSummary, ApiSpecsRepository } from '../api-specs/apiSpecsRepository';
import { queryTerms } from '../search/textSearch';
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

function json(value: unknown): CallToolResult {
  return text(JSON.stringify(value, null, 2));
}

function toolError(message: string): CallToolResult {
  // clean-code-ignore: 2.18 — isError is the standard MCP CallToolResult field for a handled failure, not a hidden side effect.
  return { isError: true, content: [{ type: 'text', text: message }] };
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
export function createApiTools(loadApis: () => ApiSpecsRepository): ToolDefinition[] {
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
        json(
          loadApis()
            .list()
            .map(({ app, urn, name, operations }) => ({ service: app, urn, name, operations })),
        ),
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
        const { query, service: serviceName, limit } = SearchArgs.parse(args);
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
        return results.length > 0
          ? json(results)
          : text(`No endpoints match "${query}". Try other keywords, or call list_service_apis.`);
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
        const { service: serviceName, method, path } = ReadArgs.parse(args);
        const apis = loadApis();
        const service = resolveService(serviceName);
        if (!service) {
          return unknownService(serviceName, apis);
        }

        const endpoint = apis.read(service, method, path);
        return endpoint
          ? json(endpoint)
          : toolError(
              `${service.app} has no ${method.toUpperCase()} ${path}. Its endpoints: ${apis.paths(service).join(', ')}.`,
            );
      },
    },
  ];
}
