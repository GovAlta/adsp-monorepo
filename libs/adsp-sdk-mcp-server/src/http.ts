import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as express from 'express';
import { createServer, Server as HttpServer } from 'http';
import { performance } from 'perf_hooks';
import { createAuthMiddleware, createProtectedResourceMetadataHandler, createTokenVerifier } from './auth';
import { McpServerConfig, readConfig } from './config';
import { createCorsAndOriginGuard, createInFlightGate, createRateLimit } from './guards';
import { createLifecycle, ServerLifecycle } from './lifecycle';
import { bucketMcpMethod, getMetrics } from './metrics';
import { Semaphore } from './semaphore';
import { createAdspMcpServer, CreateAdspMcpServerOptions, loadAdspMcpTools } from './server';
import { configureLiveToolLimit } from './tools/liveToolLimit';

const MAX_REQUEST_BODY_BYTES = 1024 * 1024;

export interface McpHttpAppOptions extends CreateAdspMcpServerOptions {
  /** Defaults to `readConfig()` over `process.env`. */
  config?: McpServerConfig;
  /** Drives `/ready`; shutdown flips it. */
  lifecycle?: ServerLifecycle;
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

export function createMcpHttpApp({
  config = readConfig(),
  lifecycle = createLifecycle(),
  ...serverOptions
}: McpHttpAppOptions = {}): express.Express {
  if (!config.auth) {
    throw new Error(
      'HTTP mode needs MCP_PUBLIC_URL, ADSP_ACCESS_SERVICE_URL and ADSP_DIRECTORY_SERVICE_URL so callers can sign in.'
    );
  }
  const { publicUrl, accessServiceUrl } = config.auth;
  const verifier = createTokenVerifier({ accessServiceUrl });

  loadAdspMcpTools(serverOptions);
  configureLiveToolLimit({ maxConcurrent: config.liveToolMaxConcurrent, waitMs: config.inFlightWaitMs });

  // No express.json(): the transport reads the body so parse and size errors come back as JSON-RPC.
  const app = express();
  app.set('trust proxy', config.trustedProxy);

  app.use((_req, res, next) => {
    // Decided when the head is written, not on arrival, so a request already running when draining starts also tells
    // its client not to reuse a socket that is about to close.
    const writeHead = res.writeHead;
    res.writeHead = function (this: express.Response, ...args: Parameters<typeof writeHead>) {
      if (lifecycle.draining && !this.headersSent) {
        this.setHeader('Connection', 'close');
      }
      return writeHead.apply(this, args);
    } as typeof res.writeHead;
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // The server listens only after the docs index is built, so this also fails while the index is loading.
  app.get('/ready', (_req, res) => {
    if (lifecycle.draining) {
      res.status(503).json({ status: 'draining' });
      return;
    }
    res.json({ status: 'ready' });
  });

  const corsAndOrigin = createCorsAndOriginGuard(config.corsOrigins);
  const metadataPath = '/.well-known/oauth-protected-resource/mcp/:tenantRealm';
  app.use(metadataPath, corsAndOrigin);
  app.get(metadataPath, createProtectedResourceMetadataHandler({ publicUrl, accessServiceUrl }));

  // Each tenant realm is its own issuer, so the endpoint names the realm; there is no shared, unauthenticated /mcp.
  app.use('/mcp/:tenantRealm', corsAndOrigin);
  app.post(
    '/mcp/:tenantRealm',
    createRateLimit(config.rateLimitPerMinute),
    // Before the gate, so requests without a valid token never hold an in-flight slot.
    createAuthMiddleware({ verifier, publicUrl }),
    createInFlightGate(new Semaphore(config.maxInFlight, { maxWaiters: config.maxInFlight }), config.inFlightWaitMs),
    createStatelessPostHandler(serverOptions)
  );
  app.get('/mcp/:tenantRealm', methodNotAllowed);
  app.delete('/mcp/:tenantRealm', methodNotAllowed);

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
