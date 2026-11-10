import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as express from 'express';
import { createServer, Server as HttpServer } from 'http';
import { performance } from 'perf_hooks';
import { McpServerConfig, readConfig } from './config';
import { createCorsAndOriginGuard, createInFlightGate, createRateLimit } from './guards';
import { bucketMcpMethod, getMetrics } from './metrics';
import { Semaphore } from './semaphore';
import { createAdspMcpServer, CreateAdspMcpServerOptions, loadAdspMcpTools } from './server';
import { configureLiveToolLimit } from './tools/liveToolLimit';

const MAX_REQUEST_BODY_BYTES = 1024 * 1024;

export interface McpHttpAppOptions extends CreateAdspMcpServerOptions {
  /** Defaults to `readConfig()` over `process.env`. */
  config?: McpServerConfig;
}

function createStatelessPostHandler(options: CreateAdspMcpServerOptions): express.RequestHandler {
  return async (req, res) => {
    const started = performance.now();
    const metrics = getMetrics();
    let method = 'unparsed';
    let messagesSeen = 0;

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
      // Node leaves statusCode at 200 when the client goes away before a response is written.
      const outcome = res.writableFinished ? res.statusCode : 'aborted';
      metrics.recordRequest(method, outcome, (performance.now() - started) / 1000);
    });

    try {
      await server.connect(transport);
      const deliver = transport.onmessage;
      // The transport parses the body itself, so the JSON-RPC method is only visible as messages arrive.
      transport.onmessage = (message, extra) => {
        messagesSeen += 1;
        method = messagesSeen > 1 ? 'batch' : bucketMcpMethod(message);
        deliver?.(message, extra);
      };
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

export function createMcpHttpApp({ config = readConfig(), ...serverOptions }: McpHttpAppOptions = {}): express.Express {
  loadAdspMcpTools(serverOptions);
  configureLiveToolLimit({ maxConcurrent: config.liveToolMaxConcurrent, waitMs: config.inFlightWaitMs });

  // No express.json(): the transport reads the body so parse and size errors come back as JSON-RPC.
  const app = express();
  app.set('trust proxy', config.trustedProxy);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/mcp', createCorsAndOriginGuard(config.corsOrigins));
  app.post(
    '/mcp',
    createRateLimit(config.rateLimitPerMinute),
    createInFlightGate(new Semaphore(config.maxInFlight, { maxWaiters: config.maxInFlight }), config.inFlightWaitMs),
    createStatelessPostHandler(serverOptions)
  );
  app.get('/mcp', methodNotAllowed);
  app.delete('/mcp', methodNotAllowed);

  return app;
}

export interface McpHttpServerOptions {
  requestTimeoutMs?: number;
  headersTimeoutMs?: number;
  connectionsCheckingIntervalMs?: number;
}

/**
 * The in-flight gate admits a request before its body arrives, so a client that never finishes sending one would hold
 * a slot until Node's 300 s default. These limits only cover receiving the request, not how long a tool call takes.
 */
export function createMcpHttpServer(app: express.Express, options: McpHttpServerOptions = {}): HttpServer {
  return createServer(
    {
      requestTimeout: options.requestTimeoutMs ?? 30_000,
      headersTimeout: options.headersTimeoutMs ?? 20_000,
      connectionsCheckingInterval: options.connectionsCheckingIntervalMs ?? 5_000,
    },
    app
  );
}
