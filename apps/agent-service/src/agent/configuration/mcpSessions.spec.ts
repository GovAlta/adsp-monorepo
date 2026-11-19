import type { MastraMCPServerDefinition } from '@mastra/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import { createServer, type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import { closeMcpClient, endMcpSessions, type McpSessionEnd } from './mcpSessions';

interface ReceivedDelete {
  sessionId: string | undefined;
  headers: IncomingHttpHeaders;
}

interface TestMcpServer {
  url: URL;
  deletes: ReceivedDelete[];
  openSessions: Set<string>;
  close(): Promise<void>;
}

interface TestMcpServerOptions {
  /** Answer DELETE with this status instead of ending the session. */
  deleteStatus?: number;
  /** Never answer DELETE. */
  hangOnDelete?: boolean;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
}

/** A stateful MCP server, one SDK transport per session, that records every DELETE it receives. */
async function startStatefulMcpServer({
  deleteStatus,
  hangOnDelete,
}: TestMcpServerOptions = {}): Promise<TestMcpServer> {
  const deletes: ReceivedDelete[] = [];
  const transports = new Map<string, StreamableHTTPServerTransport>();
  const openSessions = new Set<string>();

  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (req.method === 'DELETE') {
      deletes.push({ sessionId, headers: req.headers });
      if (hangOnDelete) {
        return;
      }
      if (deleteStatus) {
        res.writeHead(deleteStatus).end();
        return;
      }
    }

    const body = req.method === 'POST' ? await readBody(req) : undefined;
    let transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport && req.method === 'POST' && isInitializeRequest(body)) {
      const created = new StreamableHTTPServerTransport({
        sessionIdGenerator: randomUUID,
        onsessioninitialized: (id) => {
          transports.set(id, created);
          openSessions.add(id);
        },
        onsessionclosed: (id) => {
          transports.delete(id);
          openSessions.delete(id);
        },
      });
      const server = new Server({ name: 'test-server', version: '1.0.0' }, { capabilities: { tools: {} } });
      server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));
      await server.connect(created);
      transport = created;
    }
    if (!transport) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null }));
      return;
    }
    await transport.handleRequest(req, res, body);
  };

  const httpServer = createServer((req, res) => {
    handle(req, res).catch(() => {
      if (!res.headersSent) {
        res.writeHead(500).end();
      }
    });
  });
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address() as AddressInfo;

  return {
    url: new URL(`http://127.0.0.1:${port}/mcp`),
    deletes,
    openSessions,
    close: async () => {
      await Promise.all([...transports.values()].map((transport) => transport.close()));
      httpServer.closeAllConnections();
      await new Promise((resolve) => httpServer.close(resolve));
    },
  };
}

/** Opens a real session the way an MCP client does, then drops the client without ending it. */
async function openSession(url: URL): Promise<string> {
  const transport = new StreamableHTTPClientTransport(url);
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(transport);
  const sessionId = transport.sessionId as string;
  await transport.close();
  return sessionId;
}

describe('endMcpSessions', () => {
  let server: TestMcpServer | undefined;

  afterEach(async () => {
    await server?.close();
    server = undefined;
  });

  it('ends an open session on a stateful server', async () => {
    server = await startStatefulMcpServer();
    const sessionId = await openSession(server.url);
    expect(server.openSessions.has(sessionId)).toBe(true);

    const ended = await endMcpSessions({ echo: sessionId }, { echo: { url: server.url } });

    expect(ended).toEqual([{ serverId: 'echo', sessionId, outcome: 'ended', status: 200 }]);
    expect(server.deletes.map((received) => received.sessionId)).toEqual([sessionId]);
    expect(server.openSessions.has(sessionId)).toBe(false);
  });

  it('sends the configured headers and uses the configured fetch', async () => {
    server = await startStatefulMcpServer();
    const sessionId = await openSession(server.url);
    const fetchMethods: string[] = [];
    const servers: Record<string, MastraMCPServerDefinition> = {
      echo: {
        url: server.url,
        requestInit: { headers: { 'x-tenant': 'test-tenant' } },
        fetch: (url, init) => {
          fetchMethods.push(init?.method ?? 'GET');
          const headers = new Headers(init?.headers);
          headers.set('authorization', 'Bearer test-token');
          return fetch(url, { ...init, headers });
        },
      },
    };

    await endMcpSessions({ echo: sessionId }, servers);

    expect(fetchMethods).toEqual(['DELETE']);
    expect(server.deletes[0].headers['authorization']).toBe('Bearer test-token');
    expect(server.deletes[0].headers['x-tenant']).toBe('test-tenant');
    expect(server.openSessions.has(sessionId)).toBe(false);
  });

  it('treats a server that does not support ending sessions (405) as done', async () => {
    server = await startStatefulMcpServer({ deleteStatus: 405 });
    const sessionId = await openSession(server.url);

    const ended = await endMcpSessions({ echo: sessionId }, { echo: { url: server.url } });

    expect(ended).toEqual([{ serverId: 'echo', sessionId, outcome: 'unsupported', status: 405 }]);
  });

  it('treats a session the server no longer knows (404) as already ended', async () => {
    server = await startStatefulMcpServer({ deleteStatus: 404 });

    const ended = await endMcpSessions({ echo: 'gone' }, { echo: { url: server.url } });

    expect(ended).toEqual([{ serverId: 'echo', sessionId: 'gone', outcome: 'ended', status: 404 }]);
  });

  it('reports any other status as failed', async () => {
    server = await startStatefulMcpServer({ deleteStatus: 500 });

    const ended = await endMcpSessions({ echo: 'abc' }, { echo: { url: server.url } });

    expect(ended).toEqual([{ serverId: 'echo', sessionId: 'abc', outcome: 'failed', status: 500 }]);
  });

  it('reports an unreachable server as failed instead of throwing', async () => {
    const ended = await endMcpSessions({ echo: 'abc' }, { echo: { url: new URL('http://127.0.0.1:9/mcp') } });

    expect(ended).toEqual([{ serverId: 'echo', sessionId: 'abc', outcome: 'failed', error: expect.any(String) }]);
  });

  it('gives up on a server that never answers', async () => {
    server = await startStatefulMcpServer({ hangOnDelete: true });
    const started = Date.now();

    const ended = await endMcpSessions({ echo: 'abc' }, { echo: { url: server.url } }, 200);

    expect(ended).toEqual([{ serverId: 'echo', sessionId: 'abc', outcome: 'failed', error: expect.any(String) }]);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('does not follow a redirect to another origin', async () => {
    const other = await startStatefulMcpServer();
    const redirecting = createServer((_req, res) => {
      res.writeHead(307, { location: other.url.toString() }).end();
    });
    await new Promise<void>((resolve) => redirecting.listen(0, '127.0.0.1', resolve));
    const { port } = redirecting.address() as AddressInfo;
    try {
      const ended = await endMcpSessions(
        { echo: 'abc' },
        { echo: { url: new URL(`http://127.0.0.1:${port}/mcp`), requestInit: { headers: { 'x-api-key': 'secret' } } } },
      );

      expect(ended[0]).toMatchObject({ serverId: 'echo', outcome: 'failed' });
      expect(other.deletes).toEqual([]);
    } finally {
      redirecting.closeAllConnections();
      await new Promise((resolve) => redirecting.close(resolve));
      await other.close();
    }
  });

  it('reports a malformed configured header as failed instead of throwing', async () => {
    const ended = await endMcpSessions(
      { echo: 'abc' },
      { echo: { url: new URL('http://127.0.0.1:9/mcp'), requestInit: { headers: { 'bad header': 'x' } } } },
    );

    expect(ended).toEqual([{ serverId: 'echo', sessionId: 'abc', outcome: 'failed', error: expect.any(String) }]);
  });

  it('skips servers without a URL', async () => {
    const ended = await endMcpSessions({ local: 'abc' }, { local: { command: 'node', args: [] } });

    expect(ended).toEqual([]);
  });
});

describe('closeMcpClient', () => {
  function fakeClient(sessionIds: Record<string, string>, disconnect: () => Promise<void> = async () => undefined) {
    let connected = true;
    return {
      get sessionIds() {
        return connected ? sessionIds : {};
      },
      disconnect: jest.fn(async () => {
        connected = false;
        await disconnect();
      }),
    };
  }

  it('ends the sessions and disconnects', async () => {
    const server = await startStatefulMcpServer();
    try {
      const sessionId = await openSession(server.url);
      const client = fakeClient({ echo: sessionId });

      const ended = await closeMcpClient(client, { echo: { url: server.url } });

      expect(ended).toEqual([{ serverId: 'echo', sessionId, outcome: 'ended', status: 200 }]);
      expect(server.openSessions.has(sessionId)).toBe(false);
      expect(client.disconnect).toHaveBeenCalledTimes(1);
    } finally {
      await server.close();
    }
  });

  it('starts disconnecting before the session DELETEs finish', async () => {
    const server = await startStatefulMcpServer({ hangOnDelete: true });
    try {
      const client = fakeClient({ echo: 'abc' });

      const closing = closeMcpClient(client, { echo: { url: server.url } }, 300);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const disconnectCallsWhileDeletePending = client.disconnect.mock.calls.length;
      await closing;

      expect(disconnectCallsWhileDeletePending).toBe(1);
    } finally {
      await server.close();
    }
  });

  it('sends nothing when no server holds a session, as with a stateless server', async () => {
    const client = fakeClient({});

    const ended: McpSessionEnd[] = await closeMcpClient(client, { echo: { url: new URL('http://127.0.0.1:9/mcp') } });

    expect(ended).toEqual([]);
    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });

  it('still disconnects when ending a session fails', async () => {
    const client = fakeClient({ echo: 'abc' });

    const ended = await closeMcpClient(client, { echo: { url: new URL('http://127.0.0.1:9/mcp') } });

    expect(ended[0].outcome).toBe('failed');
    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });

  it('passes a disconnect error on to the caller', async () => {
    const client = fakeClient({}, async () => {
      throw new Error('disconnect failed');
    });

    await expect(closeMcpClient(client, {})).rejects.toThrow('disconnect failed');
  });
});
