import { readFileSync } from 'fs';
import { join } from 'path';
import { countTerms, queryTerms, scoreByTermFrequency, tokenize } from '../search/textSearch';

/** One entry of api-specs/index.json, written by scripts/api-specs.mjs. */
export interface ApiServiceSummary {
  app: string;
  urn: string;
  name: string;
  title?: string;
  operations: number;
  file: string;
}

export interface ApiEndpointSummary {
  service: string;
  method: string;
  path: string;
  summary?: string;
  deprecated: boolean;
  /** Sentences of the description that state who may call it (roles, tenancy, anonymous access). */
  access: string[];
}

export interface ApiEndpoint extends ApiEndpointSummary {
  serviceUrn: string;
  operationId?: string;
  description?: string;
  tags: string[];
  parameters: unknown[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
  security?: unknown;
}

type OpenApiObject = Record<string, unknown>;

interface IndexedOperation {
  endpoint: ApiEndpoint;
  strongCounts: Map<string, number>;
  bodyCounts: Map<string, number>;
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'];
const ACCESS_SENTENCE = /\b(roles?|anonymous|authenticated|public)\b/i;
/** $refs nested deeper than this stay as `{ $ref }`, which keeps one endpoint's output bounded. */
const MAX_REF_DEPTH = 4;

function accessSentences(description = ''): string[] {
  return description
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => ACCESS_SENTENCE.test(sentence));
}

/** Inlines local `#/...` references, up to MAX_REF_DEPTH and never into a reference already being expanded. */
function resolveRefs(value: unknown, spec: OpenApiObject, expanding: string[] = []): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveRefs(item, spec, expanding));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const { $ref, ...rest } = value as OpenApiObject;
  if (typeof $ref === 'string' && $ref.startsWith('#/')) {
    if (expanding.includes($ref) || expanding.length >= MAX_REF_DEPTH) {
      return value;
    }
    const target = $ref
      .slice(2)
      .split('/')
      .reduce<unknown>((node, key) => (node as OpenApiObject | undefined)?.[key], spec);
    return target === undefined ? value : resolveRefs(target, spec, [...expanding, $ref]);
  }

  return Object.fromEntries(Object.entries(rest).map(([key, item]) => [key, resolveRefs(item, spec, expanding)]));
}

function indexOperations(service: ApiServiceSummary, spec: OpenApiObject): IndexedOperation[] {
  const paths = (spec.paths ?? {}) as Record<string, OpenApiObject>;
  return Object.entries(paths).flatMap(([path, item]) =>
    HTTP_METHODS.filter((method) => item[method]).map((method) => {
      const operation = item[method] as OpenApiObject;
      const description = operation.description as string | undefined;
      const summary = operation.summary as string | undefined;
      const tags = (operation.tags as string[] | undefined) ?? [];
      const operationId = operation.operationId as string | undefined;
      const endpoint: ApiEndpoint = {
        service: service.app,
        serviceUrn: service.urn,
        method: method.toUpperCase(),
        path,
        summary,
        deprecated: operation.deprecated === true,
        access: accessSentences(description),
        operationId,
        description,
        tags,
        parameters: resolveRefs(
          [...((item.parameters as unknown[]) ?? []), ...((operation.parameters as unknown[]) ?? [])],
          spec,
        ) as unknown[],
        requestBody: resolveRefs(operation.requestBody, spec),
        responses: resolveRefs(operation.responses ?? {}, spec) as Record<string, unknown>,
        security: operation.security ?? spec.security,
      };
      return {
        endpoint,
        strongCounts: countTerms(tokenize(`${path} ${summary ?? ''} ${operationId ?? ''} ${tags.join(' ')}`)),
        bodyCounts: countTerms(tokenize(`${service.name} ${service.app} ${description ?? ''}`)),
      };
    }),
  );
}

function toSummary({ service, method, path, summary, deprecated, access }: ApiEndpoint): ApiEndpointSummary {
  return { service, method, path, summary, deprecated, access };
}

/** The bundled OpenAPI specs (api-specs/), indexed for listing, keyword search and reading one endpoint. */
export class ApiSpecsRepository {
  private readonly services: ApiServiceSummary[];
  private readonly operations: IndexedOperation[];

  constructor(apiSpecsRoot: string) {
    this.services = JSON.parse(readFileSync(join(apiSpecsRoot, 'index.json'), 'utf8'));
    this.operations = this.services.flatMap((service) =>
      indexOperations(service, JSON.parse(readFileSync(join(apiSpecsRoot, service.file), 'utf8'))),
    );
  }

  list(): ApiServiceSummary[] {
    return this.services;
  }

  /** The service named by its app folder, URN or display name; case-insensitive. */
  findService(nameOrUrn: string): ApiServiceSummary | undefined {
    const wanted = nameOrUrn.trim().toLowerCase();
    return this.services.find((s) => [s.app, s.urn, s.name].some((value) => value.toLowerCase() === wanted));
  }

  search(query: string, options: { service?: ApiServiceSummary; limit?: number } = {}): ApiEndpointSummary[] {
    const terms = queryTerms(query);
    return this.operations
      .filter(({ endpoint }) => !options.service || endpoint.service === options.service.app)
      .map((operation) => ({
        operation,
        score:
          scoreByTermFrequency(terms, operation.strongCounts) * 3 + scoreByTermFrequency(terms, operation.bodyCounts),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit ?? 10)
      .map(({ operation }) => toSummary(operation.endpoint));
  }

  read(service: ApiServiceSummary, method: string, path: string): ApiEndpoint | undefined {
    const wantedMethod = method.toUpperCase();
    return this.operations.find(
      ({ endpoint }) => endpoint.service === service.app && endpoint.method === wantedMethod && endpoint.path === path,
    )?.endpoint;
  }

  /** Paths of a service, for suggesting the right one when a read misses. */
  paths(service: ApiServiceSummary): string[] {
    return this.operations
      .filter(({ endpoint }) => endpoint.service === service.app)
      .map(({ endpoint }) => `${endpoint.method} ${endpoint.path}`);
  }
}
