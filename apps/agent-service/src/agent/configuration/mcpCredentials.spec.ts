import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Logger } from 'winston';
import { createAuthenticatedMcpFetch, loadKnownMcpServerSecrets, normalizeMcpServerUrl } from './mcpCredentials';

describe('mcpCredentials', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('loads known MCP servers from a mounted secret file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'agent-service-mcp-'));
    const filePath = join(directory, 'mcp-servers.json');

    try {
      writeFileSync(
        filePath,
        JSON.stringify({
          servers: [
            {
              url: 'https://example.com/mcp/',
              authentication: {
                type: 'oauth-client-credentials',
                tokenEndpoint: 'https://login.example.com/token',
                clientId: 'client-id',
                clientSecret: 'client-secret',
                scope: 'mcp.read',
              },
            },
          ],
        }),
      );

      const knownServers = loadKnownMcpServerSecrets(filePath, logger);
      const server = knownServers.get(normalizeMcpServerUrl(new URL('https://example.com/mcp')));

      expect(server).toEqual({
        url: 'https://example.com/mcp/',
        authentication: {
          type: 'oauth-client-credentials',
          tokenEndpoint: 'https://login.example.com/token',
          clientId: 'client-id',
          clientSecret: 'client-secret',
          scope: 'mcp.read',
        },
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('injects cached bearer tokens into MCP requests', async () => {
    const fetchImpl = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'token-1', token_type: 'Bearer', expires_in: 3600 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValue(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));

    const authenticatedFetch = createAuthenticatedMcpFetch(
      {
        type: 'oauth-client-credentials',
        tokenEndpoint: 'https://login.example.com/token',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        scope: 'mcp.read',
        audience: 'mcp',
      },
      {
        headers: {
          'x-platform': 'adsp',
        },
      },
      fetchImpl,
    );

    await authenticatedFetch('https://example.com/mcp', { headers: { 'x-agent': 'builder' } });
    await authenticatedFetch('https://example.com/mcp/tools');

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      new URL('https://login.example.com/token'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
        },
      }),
    );
    expect(String((fetchImpl.mock.calls[0]?.[1] as RequestInit).body)).toContain('grant_type=client_credentials');
    expect(String((fetchImpl.mock.calls[0]?.[1] as RequestInit).body)).toContain('scope=mcp.read');
    expect(String((fetchImpl.mock.calls[0]?.[1] as RequestInit).body)).toContain('audience=mcp');

    const firstRequestHeaders = new Headers((fetchImpl.mock.calls[1]?.[1] as RequestInit).headers);
    expect(firstRequestHeaders.get('authorization')).toBe('Bearer token-1');
    expect(firstRequestHeaders.get('x-platform')).toBe('adsp');
    expect(firstRequestHeaders.get('x-agent')).toBe('builder');

    const secondRequestHeaders = new Headers((fetchImpl.mock.calls[2]?.[1] as RequestInit).headers);
    expect(secondRequestHeaders.get('authorization')).toBe('Bearer token-1');
  });
});
