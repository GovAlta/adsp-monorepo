import type { MCPClient, MastraMCPServerDefinition } from '@mastra/mcp';

export interface McpSessionEnd {
  serverId: string;
  sessionId: string;
  outcome: 'ended' | 'unsupported' | 'failed';
  status?: number;
  error?: string;
}

type HttpMcpServerDefinition = Extract<MastraMCPServerDefinition, { url: URL }>;

const END_SESSION_TIMEOUT_MS = 5000;

function isHttpServer(server: MastraMCPServerDefinition | undefined): server is HttpMcpServerDefinition {
  return server?.url instanceof URL;
}

async function endMcpSession(
  serverId: string,
  sessionId: string,
  server: HttpMcpServerDefinition,
  timeoutMs: number,
): Promise<McpSessionEnd> {
  const headers = new Headers(server.requestInit?.headers);
  headers.set('mcp-session-id', sessionId);
  const init: RequestInit = { method: 'DELETE', headers, signal: AbortSignal.timeout(timeoutMs) };

  try {
    const response = server.fetch ? await server.fetch(server.url, init) : await fetch(server.url, init);
    await response.body?.cancel().catch(() => undefined);
    const { status } = response;
    // A 404 means the server had already dropped the session; a 405 means it doesn't let clients end sessions.
    if (response.ok || status === 404) {
      return { serverId, sessionId, outcome: 'ended', status };
    }
    if (status === 405) {
      return { serverId, sessionId, outcome: 'unsupported', status };
    }
    return { serverId, sessionId, outcome: 'failed', status };
  } catch (err) {
    return { serverId, sessionId, outcome: 'failed', error: err instanceof Error ? err.message : String(err) };
  }
}

/** Sends the MCP session DELETE for each session; Mastra's `disconnect()` only closes the transport. Never throws. */
export async function endMcpSessions(
  sessionIds: Record<string, string>,
  servers: Record<string, MastraMCPServerDefinition>,
  timeoutMs = END_SESSION_TIMEOUT_MS,
): Promise<McpSessionEnd[]> {
  const ends = Object.entries(sessionIds).flatMap(([serverId, sessionId]) => {
    const server = servers[serverId];
    return isHttpServer(server) ? [endMcpSession(serverId, sessionId, server, timeoutMs)] : [];
  });
  return Promise.all(ends);
}

/** Ends the client's open sessions, then disconnects it. A disconnect error is passed on. */
export async function closeMcpClient(
  client: Pick<MCPClient, 'sessionIds' | 'disconnect'>,
  servers: Record<string, MastraMCPServerDefinition>,
  timeoutMs = END_SESSION_TIMEOUT_MS,
): Promise<McpSessionEnd[]> {
  // Read before disconnecting: Mastra forgets the session ids once a transport closes.
  const sessionIds = client.sessionIds;
  try {
    return await endMcpSessions(sessionIds, servers, timeoutMs);
  } finally {
    await client.disconnect();
  }
}
