import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as express from 'express';
import { createAdspMcpServer, CreateAdspMcpServerOptions, loadAdspMcpTools } from './server';

const MAX_REQUEST_BODY_BYTES = 1024 * 1024;

function applyCorsHeaders(req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', process.env['CORS_ORIGIN'] ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, mcp-protocol-version');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}

function createStatelessPostHandler(options: CreateAdspMcpServerOptions): express.RequestHandler {
  return async (req, res) => {
    const server = createAdspMcpServer(options);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
    });
    // Registered before handling starts so a client that disconnects mid-request still releases both.
    res.on('close', () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      console.error('[adsp-sdk-mcp-server] Failed to handle MCP request:', err);
      sendInternalError(res);
    }
  };
}

function sendInternalError(res: express.Response): void {
  if (res.headersSent) {
    res.end();
    return;
  }
  res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
}

function methodNotAllowed(_req: express.Request, res: express.Response): void {
  res
    .status(405)
    .set('Allow', 'POST')
    .json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
}

export function createMcpHttpApp(options: CreateAdspMcpServerOptions = {}): express.Express {
  loadAdspMcpTools(options);

  // No express.json(): the transport reads the body so parse and size errors come back as JSON-RPC.
  const app = express();
  app.use(applyCorsHeaders);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/mcp', createStatelessPostHandler(options));
  app.get('/mcp', methodNotAllowed);
  app.delete('/mcp', methodNotAllowed);

  return app;
}
