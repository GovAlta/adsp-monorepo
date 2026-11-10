import { createHmac, generateKeyPairSync } from 'crypto';
import { createServer, Server } from 'http';
import { sign, SignOptions } from 'jsonwebtoken';
import type { AddressInfo, Socket } from 'net';
import type { HostedAuthConfig } from '../config';

export const TEST_KID = 'test-key';
export const TEST_AUDIENCE = 'urn:ads:platform:adsp-sdk-mcp-server';

export type RealmMode = 'ok' | 'missing' | 'down' | 'hang';

export interface AuthTestKit {
  accessServiceUrl: string;
  publicKeyPem: string;
  issuer(realm: string): string;
  /** RS256 token for `realm`, audience the MCP server; claims and options override the defaults. */
  sign(realm: string, claims?: Record<string, unknown>, options?: SignOptions): string;
  /** Unsigned or HMAC-signed tokens for algorithm-confusion tests. */
  forge(realm: string, alg: 'none' | 'HS256-with-public-key'): string;
  setMode(realm: string, mode: RealmMode): void;
  fetchCount(realm?: string): number;
  hostedAuth(publicUrl?: string): HostedAuthConfig;
  close(): Promise<void>;
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

export async function createAuthTestKit(): Promise<AuthTestKit> {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: TEST_KID, use: 'sig', alg: 'RS256' };

  const modes = new Map<string, RealmMode>();
  const fetches = new Map<string, number>();
  const sockets = new Set<Socket>();

  const server: Server = createServer((req, res) => {
    const match = /^\/auth\/realms\/([^/]+)\/protocol\/openid-connect\/certs$/.exec(req.url ?? '');
    if (!match) {
      res.writeHead(404).end();
      return;
    }
    const realm = decodeURIComponent(match[1]);
    fetches.set(realm, (fetches.get(realm) ?? 0) + 1);
    const mode = modes.get(realm) ?? 'ok';
    if (mode === 'hang') {
      return;
    }
    if (mode === 'missing') {
      res.writeHead(404, { 'content-type': 'application/json' }).end('{"error":"Realm does not exist"}');
      return;
    }
    if (mode === 'down') {
      res.writeHead(500).end();
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ keys: [jwk] }));
  });
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  await new Promise<void>((resolveListening) => server.listen(0, '127.0.0.1', resolveListening));
  const accessServiceUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const issuer = (realm: string) => `${accessServiceUrl}/auth/realms/${realm}`;

  return {
    accessServiceUrl,
    publicKeyPem,
    issuer,
    sign(realm, claims = {}, options = {}) {
      return sign({ azp: 'adsp-mcp', sub: 'user-1', scope: 'openid profile', ...claims }, privateKeyPem, {
        algorithm: 'RS256',
        keyid: TEST_KID,
        issuer: issuer(realm),
        audience: TEST_AUDIENCE,
        expiresIn: 300,
        ...options,
      });
    },
    forge(realm, alg) {
      const payload = base64url(
        JSON.stringify({ iss: issuer(realm), aud: TEST_AUDIENCE, sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 300 })
      );
      if (alg === 'none') {
        return `${base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${payload}.`;
      }
      const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: TEST_KID }));
      const signature = createHmac('sha256', publicKeyPem).update(`${header}.${payload}`).digest('base64url');
      return `${header}.${payload}.${signature}`;
    },
    setMode: (realm, mode) => modes.set(realm, mode),
    fetchCount: (realm) =>
      realm === undefined ? [...fetches.values()].reduce((sum, count) => sum + count, 0) : fetches.get(realm) ?? 0,
    hostedAuth: (publicUrl = 'http://127.0.0.1:9') => ({
      publicUrl,
      accessServiceUrl,
      directoryServiceUrl: 'http://127.0.0.1:9',
    }),
    async close() {
      sockets.forEach((socket) => socket.destroy());
      await new Promise((resolveClosed) => server.close(() => resolveClosed(undefined)));
    },
  };
}
