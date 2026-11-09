import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import * as express from 'express';
import { createAdspMcpServer, CreateAdspMcpServerOptions, loadAdspMcpTools } from './server';

export interface McpHttpAppOptions extends CreateAdspMcpServerOptions {
  sessionTtlMs: number;
}

export interface McpHttpApp {
  app: express.Express;
  close(): void;
}

interface SessionEntry {
  server: Server;
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
}

type Sessions = Map<string, SessionEntry>;

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

function startIdleSweep(sessions: Sessions, sessionTtlMs: number): NodeJS.Timeout {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of sessions) {
      if (now - entry.lastActivity > sessionTtlMs) {
        sessions.delete(id);
        entry.server.close();
      }
    }
  }, 60_000);
  timer.unref();
  return timer;
}

function createPostHandler(sessions: Sessions, options: CreateAdspMcpServerOptions): express.RequestHandler {
  return async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && sessions.has(sessionId)) {
      const entry = sessions.get(sessionId)!;
      entry.lastActivity = Date.now();
      await entry.transport.handleRequest(req, res, req.body);
      return;
    }

    const newId = randomUUID();
    const sessionServer = createAdspMcpServer(options);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newId,
      onsessioninitialized: (id) => {
        sessions.set(id, { server: sessionServer, transport, lastActivity: Date.now() });
      },
    });

    transport.onclose = () => {
      const found = [...sessions.entries()].find(([, e]) => e.transport === transport);
      if (found) {
        sessions.delete(found[0]);
        found[1].server.close();
      }
    };

    await sessionServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };
}

function findSession(sessions: Sessions, req: express.Request, res: express.Response): [string, SessionEntry] | undefined {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session ID' });
    return undefined;
  }
  return [sessionId, sessions.get(sessionId)!];
}

function registerSessionRoutes(app: express.Express, options: McpHttpAppOptions): () => void {
  const sessions: Sessions = new Map();
  const cleanupTimer = startIdleSweep(sessions, options.sessionTtlMs);

  app.post('/mcp', createPostHandler(sessions, options));

  app.get('/mcp', async (req, res) => {
    const found = findSession(sessions, req, res);
    if (!found) return;
    found[1].lastActivity = Date.now();
    await found[1].transport.handleRequest(req, res);
  });

  app.delete('/mcp', async (req, res) => {
    const found = findSession(sessions, req, res);
    if (!found) return;
    sessions.delete(found[0]);
    await found[1].transport.handleRequest(req, res);
  });

  return () => {
    clearInterval(cleanupTimer);
    for (const [id, entry] of sessions) {
      sessions.delete(id);
      entry.server.close();
    }
  };
}

export function createMcpHttpApp(options: McpHttpAppOptions): McpHttpApp {
  loadAdspMcpTools(options);

  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(applyCorsHeaders);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const close = registerSessionRoutes(app, options);
  return { app, close };
}
