import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as express from 'express';
import { createAdspMcpServer, CreateAdspMcpServerOptions, loadAdspMcpTools } from './server';

function applyCorsHeaders(req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', process.env['CORS_ORIGIN'] ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
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
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    // Registered before handling starts so a client that disconnects mid-request still releases both.
    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };
}

function methodNotAllowed(_req: express.Request, res: express.Response): void {
  res
    .status(405)
    .set('Allow', 'POST')
    .json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
}

export function createMcpHttpApp(options: CreateAdspMcpServerOptions = {}): express.Express {
  loadAdspMcpTools(options);

  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(applyCorsHeaders);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/mcp', createStatelessPostHandler(options));
  app.get('/mcp', methodNotAllowed);
  app.delete('/mcp', methodNotAllowed);

  return app;
}
