import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { join } from 'path';
import { DocsRepository } from './docs/docsRepository';
import { createDocsTools } from './tools/registerDocsTools';
import { createQuickstartTool } from './tools/registerQuickstartTool';
import { createSdkTools } from './tools/registerSdkTools';

export interface CreateAdspMcpServerOptions {
  /** Root directory of bundled ADSP docs. Defaults to the assets copied alongside the built package. */
  docsRoot?: string;
}

export function createAdspMcpServer(options: CreateAdspMcpServerOptions = {}): Server {
  // Compiled output places this file under dist/.../src/, while the docs asset copy lands one level up at dist/.../assets/docs.
  const docsRoot = options.docsRoot ?? join(__dirname, '..', 'assets', 'docs');
  const docs = new DocsRepository(docsRoot);

  const tools = [...createDocsTools(docs), ...createSdkTools(), ...createQuickstartTool()];
  const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));

  const server = new Server({ name: 'adsp-sdk-mcp-server', version: '0.0.1' }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = toolsByName.get(request.params.name);
    if (!tool) {
      return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }] };
    }

    return tool.handler(request.params.arguments ?? {});
  });

  return server;
}
