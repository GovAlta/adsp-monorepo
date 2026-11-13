import { EventEmitter } from 'events';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import type { Server as HttpServer } from 'http';
import { tmpdir } from 'os';
import { join } from 'path';
import { bundledApiSpecsRoot, bundledDocsRoot, startService } from './start';

describe('adsp-sdk-mcp-service', () => {
  let cwd: string;
  let httpServer: HttpServer | undefined;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    cwd = mkdtempSync(join(tmpdir(), 'adsp-sdk-mcp-service-'));
    const docs = join(cwd, 'dist', 'apps', 'adsp-sdk-mcp-service', 'assets', 'docs', 'services');
    mkdirSync(docs, { recursive: true });
    writeFileSync(join(docs, 'event-service.md'), '---\ntitle: Event service\n---\n\nRoutes domain events.');
    const apiSpecs = join(cwd, 'dist', 'apps', 'adsp-sdk-mcp-service', 'assets', 'api-specs');
    mkdirSync(apiSpecs, { recursive: true });
    writeFileSync(
      join(apiSpecs, 'index.json'),
      JSON.stringify([
        {
          app: 'event-service',
          urn: 'urn:ads:platform:event-service',
          name: 'Event service',
          operations: 0,
          file: 'event-service.json',
        },
      ]),
    );
    writeFileSync(
      join(apiSpecs, 'event-service.json'),
      JSON.stringify({ openapi: '3.0.0', info: { title: 'Event service' }, paths: {} }),
    );
  });

  afterEach(async () => {
    if (httpServer) {
      httpServer.closeAllConnections();
      await new Promise((resolveClosed) => httpServer?.close(() => resolveClosed(undefined)));
      httpServer = undefined;
    }
    rmSync(cwd, { recursive: true, force: true });
    consoleError.mockRestore();
  });

  it('reads the docs the build copies next to the bundle', () => {
    expect(bundledDocsRoot(cwd)).toBe(join(cwd, 'dist', 'apps', 'adsp-sdk-mcp-service', 'assets', 'docs'));
  });

  it('reads the API specs the build copies next to the bundle', () => {
    expect(bundledApiSpecsRoot(cwd)).toBe(join(cwd, 'dist', 'apps', 'adsp-sdk-mcp-service', 'assets', 'api-specs'));
  });

  it('serves the bundled API specs', async () => {
    ({ httpServer } = await startService({
      cwd,
      port: 0,
      host: '127.0.0.1',
      env: {},
      signals: new EventEmitter(),
      exit: jest.fn(),
    }));
    const { port } = httpServer.address() as { port: number };

    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'list_service_apis', arguments: {} },
      }),
    });
    const body = await response.json();

    expect(body.result.isError).toBeFalsy();
    expect(body.result.content[0].text).toContain('urn:ads:platform:event-service');
  });

  it('serves MCP tool calls from the bundled docs and reports ready', async () => {
    ({ httpServer } = await startService({
      cwd,
      port: 0,
      host: '127.0.0.1',
      env: {},
      signals: new EventEmitter(),
      exit: jest.fn(),
    }));
    const { port } = httpServer.address() as { port: number };

    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'search_adsp_docs', arguments: { query: 'event service' } },
      }),
    });
    const body = await response.json();

    expect((await fetch(`http://127.0.0.1:${port}/ready`)).status).toBe(200);
    expect(body.result.content[0].text).toContain('services/event-service.md');
  });
});
