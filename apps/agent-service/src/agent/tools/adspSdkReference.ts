import * as path from 'path';
import { createTool } from '@mastra/core/tools';
import { DocsRepository, searchSdkReference } from '@abgov/adsp-sdk-mcp-server';
import type { Logger } from 'winston';
import z from 'zod';

interface AdspSdkReferenceToolsProps {
  logger: Logger;
  /** Override for tests; defaults to the docs copied into agent-service's own build output. */
  docsRoot?: string;
}

let cachedDocsRepository: DocsRepository | null = null;

function loadDocsRepository(logger: Logger, docsRoot?: string): DocsRepository {
  if (cachedDocsRepository) {
    return cachedDocsRepository;
  }

  // Docs are copied into agent-service output during build (see project.json assets).
  const resolvedDocsRoot = docsRoot ?? path.resolve(process.cwd(), 'dist/apps/agent-service/assets/docs');
  cachedDocsRepository = new DocsRepository(resolvedDocsRoot);

  logger.info('ADSP docs repository loaded.', { context: 'adspSdkReferenceTools', docsRoot: resolvedDocsRoot });

  return cachedDocsRepository;
}

const docsSearchResultSchema = z.object({
  path: z.string(),
  title: z.string(),
  snippet: z.string(),
  score: z.number(),
});

const sdkSymbolSchema = z.object({
  name: z.string(),
  kind: z.string(),
  module: z.string(),
  summary: z.string(),
  details: z.string().optional(),
  example: z.string().optional(),
  deprecated: z.boolean().optional(),
  seeAlso: z.array(z.string()).optional(),
});

export function createAdspSdkReferenceTools({ logger, docsRoot }: AdspSdkReferenceToolsProps) {
  const searchAdspDocsTool = createTool({
    id: 'search-adsp-docs',
    description:
      'Search ADSP platform documentation (getting started, architecture, service concepts, tutorials) by keyword. ' +
      'Use to cross-check or supplement nx-adsp templates for concepts a template does not cover.',
    inputSchema: z.object({
      query: z.string().describe('Keywords to search for, e.g. "send a domain event" or "directory service".'),
      limit: z.number().int().min(1).max(20).optional().describe('Maximum number of results to return (default 5).'),
    }),
    outputSchema: z.object({ results: z.array(docsSearchResultSchema) }),
    execute: async ({ query, limit }) => ({
      results: loadDocsRepository(logger, docsRoot).search(query, limit ?? 5),
    }),
  });

  const readAdspDocTool = createTool({
    id: 'read-adsp-doc',
    description: 'Read the full markdown content of an ADSP doc page by its path, as returned by search-adsp-docs.',
    inputSchema: z.object({
      path: z.string().describe('Doc path, e.g. "services/event-service.md".'),
    }),
    outputSchema: z.object({
      doc: z.object({ path: z.string(), title: z.string(), content: z.string() }).nullable(),
    }),
    execute: async ({ path: docPath }) => ({
      doc: loadDocsRepository(logger, docsRoot).read(docPath) ?? null,
    }),
  });

  const searchAdspSdkReferenceTool = createTool({
    id: 'search-adsp-sdk-reference',
    description:
      'Search the live @abgov/adsp-service-sdk reference by symbol name, module, or keyword. Use to verify or ' +
      'supplement SDK constraint details in nx-adsp templates (e.g. exact option/return shapes) against the actual current SDK.',
    inputSchema: z.object({
      query: z.string().describe('Symbol name or keyword, e.g. "initializeService", "DomainEventDefinition".'),
      limit: z.number().int().min(1).max(20).optional().describe('Maximum number of results to return (default 5).'),
    }),
    outputSchema: z.object({ results: z.array(sdkSymbolSchema) }),
    execute: async ({ query, limit }) => ({
      results: searchSdkReference(query, limit ?? 5),
    }),
  });

  return { searchAdspDocsTool, readAdspDocTool, searchAdspSdkReferenceTool };
}

export type AdspSdkReferenceTools = ReturnType<typeof createAdspSdkReferenceTools>;
