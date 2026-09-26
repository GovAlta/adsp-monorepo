import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createDocumentedResponseRecorder } from './swagger';

describe('createDocumentedResponseRecorder', () => {
  let directory: string;

  beforeAll(() => {
    directory = mkdtempSync(join(tmpdir(), 'swagger-'));
    writeFileSync(
      join(directory, 'fragment.yml'),
      [
        '/test/v1/items/mine:',
        '  get:',
        '    responses:',
        '      200:',
        '        description: OK',
        '/test/v1/items/{id}:',
        '  get:',
        '    responses:',
        '      200:',
        '        description: OK',
        '      404:',
        '        description: Not found',
      ].join('\n'),
    );
    writeFileSync(
      join(directory, 'document.yml'),
      [
        'openapi: 3.0.0',
        'paths:',
        '  /test/v1/items:',
        '    post:',
        '      responses:',
        '        201:',
        '          description: Created',
      ].join('\n'),
    );
  });

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  function respond(
    recorder: ReturnType<typeof createDocumentedResponseRecorder>,
    method: string,
    originalUrl: string,
    statusCode: number,
  ) {
    let onFinish: () => void;
    const res = {
      statusCode,
      on: jest.fn((_event: string, callback: () => void) => {
        onFinish = callback;
      }),
    };
    const next = jest.fn();
    recorder.middleware({ method, originalUrl } as never, res as never, next);
    expect(next).toHaveBeenCalled();
    onFinish();
  }

  it('passes for documented responses', async () => {
    const recorder = createDocumentedResponseRecorder(join(directory, 'fragment.yml'));
    respond(recorder, 'GET', '/test/v1/items/123?top=10', 404);
    respond(recorder, 'GET', '/test/v1/items/mine', 200);
    await expect(recorder.assertDocumented()).resolves.toBeUndefined();
  });

  it('fails for an undocumented status code', async () => {
    const recorder = createDocumentedResponseRecorder(join(directory, 'fragment.yml'));
    respond(recorder, 'GET', '/test/v1/items/123', 403);
    await expect(recorder.assertDocumented()).rejects.toThrow('GET /test/v1/items/{id} responded 403');
  });

  it('matches a literal path before a templated one', async () => {
    const recorder = createDocumentedResponseRecorder(join(directory, 'fragment.yml'));
    respond(recorder, 'GET', '/test/v1/items/mine', 404);
    await expect(recorder.assertDocumented()).rejects.toThrow('GET /test/v1/items/mine responded 404');
  });

  it('fails for an undocumented operation', async () => {
    const recorder = createDocumentedResponseRecorder(join(directory, 'fragment.yml'));
    respond(recorder, 'DELETE', '/test/v1/items/123', 200);
    await expect(recorder.assertDocumented()).rejects.toThrow(
      'DELETE /test/v1/items/123 is not a documented operation',
    );
  });

  it('reads paths from a full document', async () => {
    const recorder = createDocumentedResponseRecorder(join(directory, 'document.yml'));
    respond(recorder, 'POST', '/test/v1/items', 201);
    await expect(recorder.assertDocumented()).resolves.toBeUndefined();
  });

  it('clears recorded responses after asserting', async () => {
    const recorder = createDocumentedResponseRecorder(join(directory, 'fragment.yml'));
    respond(recorder, 'GET', '/test/v1/items/123', 403);
    await expect(recorder.assertDocumented()).rejects.toThrow();
    await expect(recorder.assertDocumented()).resolves.toBeUndefined();
  });
});
