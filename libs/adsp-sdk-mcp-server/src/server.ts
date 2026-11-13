import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, CallToolResult, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { join, resolve } from 'path';
import { performance } from 'perf_hooks';
import { ApiSpecsRepository } from './api-specs/apiSpecsRepository';
import { DocsRepository } from './docs/docsRepository';
import { getMetrics, ToolErrorType } from './metrics';
import { createApiTools } from './tools/registerApiTools';
import { createConfigurationSchemaTools } from './tools/registerConfigurationSchemaTool';
import { isBusyResult } from './tools/liveToolLimit';
import { createDocsTools } from './tools/registerDocsTools';
import { createQuickstartTool } from './tools/registerQuickstartTool';
import { createServiceRolesTools } from './tools/registerServiceRolesTool';
import { createSdkTools } from './tools/registerSdkTools';
import { createServerInfoTool } from './tools/registerServerInfoTool';
import { LiveToolDefinition, ToolDefinition } from './tools/types';
import { readPackageVersion } from './version';

export interface CreateAdspMcpServerOptions {
  /** Root directory of bundled ADSP docs. Defaults to the assets copied alongside the built package. */
  docsRoot?: string;
  /** Root directory of bundled OpenAPI specs. Defaults to the assets copied alongside the built package. */
  apiSpecsRoot?: string;
}

export interface AdspMcpTools {
  tools: (ToolDefinition | LiveToolDefinition)[];
  toolsByName: Map<string, ToolDefinition | LiveToolDefinition>;
}

// Compiled output places this file under dist/.../src/, while the docs asset copy lands one level up at dist/.../assets/docs.
const DEFAULT_DOCS_ROOT = join(__dirname, '..', 'assets', 'docs');
const DEFAULT_API_SPECS_ROOT = join(__dirname, '..', 'assets', 'api-specs');

const toolsByRoots = new Map<string, AdspMcpTools>();

function lazy<T>(create: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= create());
}

export function loadAdspMcpTools(options: CreateAdspMcpServerOptions = {}): AdspMcpTools {
  const docsRoot = resolve(options.docsRoot ?? DEFAULT_DOCS_ROOT);
  const apiSpecsRoot = resolve(options.apiSpecsRoot ?? DEFAULT_API_SPECS_ROOT);
  const cacheKey = `${docsRoot}\0${apiSpecsRoot}`;
  const cached = toolsByRoots.get(cacheKey);
  if (cached) {
    return cached;
  }

  const started = performance.now();
  const docs = new DocsRepository(docsRoot);
  const tools = [
    ...createDocsTools(docs),
    ...createSdkTools(),
    ...createQuickstartTool(),
    ...createServiceRolesTools(),
    ...createConfigurationSchemaTools(),
    ...createServerInfoTool(docs),
    ...createApiTools(lazy(() => new ApiSpecsRepository(apiSpecsRoot))),
  ];
  const loaded = { tools, toolsByName: new Map(tools.map((tool) => [tool.name, tool])) };
  toolsByRoots.set(cacheKey, loaded);
  getMetrics().recordDocsIndexBuild(secondsSince(started));
  return loaded;
}

export function createAdspMcpServer(options: CreateAdspMcpServerOptions = {}): Server {
  const { tools, toolsByName } = loadAdspMcpTools(options);

  // Deliberately using the low-level Server (McpServer is recommended for typical cases) rather than an oversight:
  // this workspace hoists multiple physical copies of zod (root zod@3.x plus nested zod@4.x/3.x under unrelated
  // deps like @mastra/schema-compat). McpServer.registerTool's zod-compat generics reconcile our zod against the
  // SDK's internally-typed zod/v3, and across mismatched physical copies that blows up ("Type instantiation is
  // excessively deep", or a concrete structural mismatch under strict mode). A root-level zod version override
  // would fix it but risks changing runtime behavior for unrelated consumers (e.g. agent-service's Mastra agent
  // config). Server + setRequestHandler avoids the SDK's zod-compat generics entirely; tools validate their own
  // args with zod as a plain value (see tools/*.ts), never passing a schema through the SDK's type machinery.
  const server = new Server(
    { name: 'adsp-sdk-mcp-server', version: readPackageVersion() },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const started = performance.now();
    const tool = toolsByName.get(request.params.name);
    if (!tool) {
      // The label is fixed so client-supplied names can't create new metric series.
      getMetrics().recordToolCall('unknown', secondsSince(started), 'unknown_tool');
      return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }] };
    }

    try {
      // clean-code-ignore: 2.18 — ToolDefinition.handler is documented (tools/types.ts) as a pure, side-effect-free lookup.
      const result = await tool.handler(request.params.arguments ?? {}, { signal: extra.signal });
      getMetrics().recordToolCall(tool.name, secondsSince(started), toolErrorType(result));
      return result;
    } catch (err) {
      getMetrics().recordToolCall(tool.name, secondsSince(started), 'exception');
      throw err;
    }
  });

  return server;
}

function toolErrorType(result: CallToolResult): ToolErrorType | undefined {
  if (isBusyResult(result)) {
    return 'busy';
  }
  return result.isError ? 'tool_error' : undefined;
}

function secondsSince(started: number): number {
  return (performance.now() - started) / 1000;
}
