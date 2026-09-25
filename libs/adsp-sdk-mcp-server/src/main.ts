#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import * as express from 'express';
import { randomUUID } from 'crypto';
import { createAdspMcpServer } from './server';

type Transport = 'stdio' | 'http';

function resolveTransport(): Transport {
  const raw = process.env['MCP_TRANSPORT'] ?? 'stdio';
  if (raw === 'stdio' || raw === 'http') return raw;
  console.error(`[adsp-sdk-mcp-server] Unknown MCP_TRANSPORT="${raw}". Valid values: stdio, http. Defaulting to stdio.`);
  return 'stdio';
}

async function main(): Promise<void> {
  const transport = resolveTransport();
  console.error(`[adsp-sdk-mcp-server] transport=${transport} sessionTtlMs=${SESSION_TTL_MS}`);

  if (transport === 'http') {
    await startHttp();
  } else {
    const server = createAdspMcpServer();
    await server.connect(new StdioServerTransport());
  }
}

const SESSION_TTL_MS = parseInt(process.env['SESSION_TTL_MINUTES'] ?? '30', 10) * 60 * 1000;

interface SessionEntry {
  server: Server;
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
}

async function startHttp(): Promise<void> {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env['CORS_ORIGIN'] ?? '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
    res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
    if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const sessions = new Map<string, SessionEntry>();

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of sessions) {
      if (now - entry.lastActivity > SESSION_TTL_MS) {
        sessions.delete(id);
        entry.server.close();
      }
    }
  }, 60_000);
  cleanupTimer.unref();

  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && sessions.has(sessionId)) {
      const entry = sessions.get(sessionId)!;
      entry.lastActivity = Date.now();
      await entry.transport.handleRequest(req, res, req.body);
      return;
    }

    const newId = randomUUID();
    const sessionServer = createAdspMcpServer();
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
  });

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    const entry = sessions.get(sessionId)!;
    entry.lastActivity = Date.now();
    await entry.transport.handleRequest(req, res);
  });

  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    const entry = sessions.get(sessionId)!;
    sessions.delete(sessionId);
    await entry.transport.handleRequest(req, res);
  });

  return new Promise((resolve) => {
    const httpServer = app.listen(port, () => {
      console.error(`[adsp-sdk-mcp-server] HTTP server listening on :${port}`);
      resolve();
    });

    function shutdown() {
      clearInterval(cleanupTimer);
      for (const [id, entry] of sessions) {
        sessions.delete(id);
        entry.server.close();
      }
      httpServer.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 5_000).unref();
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  });
}

main().catch((err) => {
  console.error('Failed to start adsp-sdk-mcp-server:', err);
  process.exit(1);
});
