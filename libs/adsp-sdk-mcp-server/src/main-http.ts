import { createServer, IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { DocsRepository } from './docs/docsRepository';
import { createAdspMcpServer } from './server';

const PORT = parseInt(process.env['PORT'] ?? '3333', 10);

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
};

// Load docs once at startup; share across per-request server instances.
const sharedDocs = new DocsRepository(join(__dirname, '..', 'assets', 'docs'));

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.url?.startsWith('/mcp')) {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const mcpServer = createAdspMcpServer({ docs: sharedDocs });
    mcpServer
      .connect(transport)
      .then(() => transport.handleRequest(req, res))
      .catch((err: unknown) => {
        process.stderr.write(`MCP request error: ${err instanceof Error ? err.stack : String(err)}\n`);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end();
        }
      });
    return;
  }

  res.writeHead(404);
  res.end();
});

httpServer.listen(PORT, () => {
  process.stderr.write(`ADSP MCP Server HTTP listening on port ${PORT}\n`);
});
