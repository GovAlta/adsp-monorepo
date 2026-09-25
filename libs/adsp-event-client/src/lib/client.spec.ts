import { AdspEventClient } from './client';
import type { AdspEventClientOptions, AdspEventStatus } from './types';

interface FakeStream {
  push(text: string): void;
  close(): void;
  error(err: Error): void;
}

function createFetch() {
  const streams: FakeStream[] = [];
  const requests: { url: string; init: RequestInit }[] = [];
  const statuses: number[] = [];

  const fetch = jest.fn(async (url: string, init: RequestInit) => {
    requests.push({ url, init });
    const status = statuses.shift() || 200;
    let controller: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({
      start: (c) => {
        controller = c;
      },
    });
    init.signal.addEventListener('abort', () => {
      try {
        controller.error(new DOMException('Aborted', 'AbortError'));
      } catch {
        // Already closed.
      }
    });
    const encoder = new TextEncoder();
    streams.push({
      push: (text) => controller.enqueue(encoder.encode(text)),
      close: () => controller.close(),
      error: (err) => controller.error(err),
    });
    return { ok: status === 200, status, body } as unknown as Response;
  });

  return { fetch, streams, requests, statuses };
}

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

async function waitFor(condition: () => boolean, timeoutMs = 2000) {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting for condition.');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

const frame = (cursor: string, name: string, eventId: string, extra: Record<string, unknown> = {}) =>
  `id: ${cursor}\ndata: ${JSON.stringify({ namespace: 'test-service', name, eventId, ...extra })}\n\n`;
const ready = (cursor: string) => `event: adsp:ready\nid: ${cursor}\ndata: {"cursor":"${cursor}"}\n\n`;
const logger = { debug: jest.fn(), warn: jest.fn() };
const CURSOR_KEY = 'adsp-events:-:test:anonymous:';

describe('AdspEventClient', () => {
  let clients: AdspEventClient[] = [];
  afterEach(() => {
    clients.forEach((client) => client.stop());
    clients = [];
  });

  function createClient(options: Partial<AdspEventClientOptions> = {}) {
    const fake = createFetch();
    const storage = createStorage();
    const client = new AdspEventClient({
      pushServiceUrl: 'https://push.test',
      stream: 'test',
      fetch: fake.fetch,
      storage,
      logger,
      retryDelayMs: 1,
      reconnectDelayMs: { min: 1, max: 2 },
      ...options,
    });
    clients.push(client);
    return { client, storage: (options.storage as ReturnType<typeof createStorage>) || storage, ...fake };
  }

  const cursorOf = (storage: ReturnType<typeof createStorage>) =>
    [...storage.values.entries()].find(([key]) => key.startsWith(CURSOR_KEY))?.[1];

  it('can deliver events to handlers in order and advance the cursor after they complete', async () => {
    const { client, streams, storage } = createClient();
    const received: string[] = [];
    let release: () => void;
    client.on('test-service:test-started', async (event) => {
      received.push(event.eventId);
      if (event.eventId === 'e1') {
        await new Promise<void>((resolve) => (release = resolve));
      }
    });
    const statuses: AdspEventStatus[] = [];
    client.onStatus((status) => statuses.push(status));

    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push(ready('ep.1-0') + frame('ep.2-0', 'test-started', 'e1') + frame('ep.3-0', 'test-started', 'e2'));

    await waitFor(() => received.length === 1);
    expect(cursorOf(storage)).toBe('ep.1-0');
    await new Promise((resolve) => setTimeout(resolve, 20));
    // Held while the first handler is still running; the second waits its turn.
    expect(received).toEqual(['e1']);
    expect(cursorOf(storage)).toBe('ep.1-0');

    release();
    await waitFor(() => cursorOf(storage) === 'ep.3-0');
    expect(received).toEqual(['e1', 'e2']);
    expect(client.getStatus()).toBe('live');
    expect(statuses).toEqual(['connecting', 'live']);
  });

  it('can send cursor, token, tenant and criteria on connect', async () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'user-1' })).toString('base64url');
    const storage = createStorage();
    const { client, requests, streams } = createClient({
      tenant: 'my-tenant',
      criteria: { context: { a: 1 } },
      getToken: async () => `header.${payload}.sig`,
      storage,
    });

    client.start();
    await waitFor(() => requests.length === 1);
    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/stream/v1/streams/test');
    expect(url.searchParams.get('tenant')).toBe('my-tenant');
    expect(JSON.parse(url.searchParams.get('criteria'))).toEqual({ context: { a: 1 } });
    expect(requests[0].init.headers).toEqual(
      expect.objectContaining({ Accept: 'text/event-stream', Authorization: `Bearer header.${payload}.sig` }),
    );

    // Cursor is kept per tenant, stream, user and criteria.
    streams[0].push(ready('ep.5-0'));
    await waitFor(() => [...storage.values.keys()].some((k) => k.startsWith('adsp-events:my-tenant:test:user-1:')));
    client.stop();
    client.start();
    await waitFor(() => requests.length === 2);
    expect(requests[1].init.headers).toEqual(expect.objectContaining({ 'Last-Event-ID': 'ep.5-0' }));
  });

  it('can reconnect with the last processed cursor after the stream ends', async () => {
    const { client, streams, requests } = createClient();
    const handler = jest.fn();
    client.on('test-service:test-started', handler);

    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push(ready('ep.1-0') + frame('ep.2-0', 'test-started', 'e1'));
    await waitFor(() => handler.mock.calls.length === 1);
    streams[0].close();

    await waitFor(() => requests.length === 2);
    expect(requests[1].init.headers).toEqual(expect.objectContaining({ 'Last-Event-ID': 'ep.2-0' }));
    expect(client.getStatus()).toBe('replaying');

    // Replayed overlap is de-duplicated by event id.
    streams[1].push(frame('ep.2-0', 'test-started', 'e1') + frame('ep.3-0', 'test-started', 'e2') + ready('ep.3-0'));
    await waitFor(() => handler.mock.calls.length === 2);
    expect(handler.mock.calls.map(([event]) => event.eventId)).toEqual(['e1', 'e2']);
    await waitFor(() => client.getStatus() === 'live');
  });

  it('can reconnect after a failed request', async () => {
    const { client, statuses, requests } = createClient();
    statuses.push(503);
    client.start();
    await waitFor(() => requests.length === 2);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('503'));
  });

  it('can reconnect immediately when the server asks', async () => {
    const { client, streams, requests } = createClient({ reconnectDelayMs: { min: 10000, max: 10000 } });
    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push('event: adsp:reconnect\ndata: {"reason":"token-expired"}\n\n');
    await waitFor(() => requests.length === 2);
  });

  it('can reconnect when the connection goes idle', async () => {
    const { client, requests } = createClient({ idleTimeoutMs: 20 });
    client.start();
    await waitFor(() => requests.length === 2);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('idle'));
  });

  it('can retry a failed handler and hold the cursor until it succeeds', async () => {
    const { client, streams, storage } = createClient();
    const handler = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce(undefined);
    client.on('test-service:test-started', handler);

    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push(frame('ep.2-0', 'test-started', 'e1'));
    await waitFor(() => cursorOf(storage) === 'ep.2-0');

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler.mock.calls.map(([, context]) => context.attempt)).toEqual([1, 2, 3]);
  });

  it('can give up on a handler after retries and advance the cursor', async () => {
    const onError = jest.fn();
    const { client, streams, storage } = createClient({ onError, retries: 1 });
    client.on('test-service:test-started', jest.fn().mockRejectedValue(new Error('poison')));

    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push(frame('ep.2-0', 'test-started', 'e1'));
    await waitFor(() => cursorOf(storage) === 'ep.2-0');

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ eventId: 'e1' }), expect.any(Error));
  });

  it('can time out a handler and abort its signal', async () => {
    const { client, streams, storage } = createClient({ retries: 0 });
    let signal: AbortSignal;
    client.on('test-service:test-started', (_event, context) => {
      signal = context.signal;
      return new Promise(() => undefined);
    }, { timeoutMs: 10 });

    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push(frame('ep.2-0', 'test-started', 'e1'));
    await waitFor(() => cursorOf(storage) === 'ep.2-0');
    expect(signal.aborted).toBe(true);
  });

  it('can call onResync on reset', async () => {
    const onResync = jest.fn();
    const { client, streams, storage } = createClient({ onResync });
    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push('event: adsp:reset\ndata: {"reason":"cursor-expired"}\n\n' + ready('ep2.9-0'));
    await waitFor(() => cursorOf(storage) === 'ep2.9-0');
    expect(onResync).toHaveBeenCalledTimes(1);
  });

  it('can filter handlers by name, wildcard and criteria', async () => {
    const { client, streams, storage } = createClient();
    const named = jest.fn();
    const all = jest.fn();
    const filtered = jest.fn();
    client.on(['test-service:test-started', 'test-service:test-ended'], named);
    client.on('*', all);
    client.on('test-service:test-started', filtered, { criteria: { correlationId: 'c1', context: { a: 1 } } });
    const remove = client.on('test-service:test-started', named);
    remove();

    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push(
      frame('ep.1-0', 'test-started', 'e1', { correlationId: 'c1', context: { a: 1 } }) +
        frame('ep.2-0', 'test-started', 'e2', { correlationId: 'c2', context: { a: 1 } }) +
        frame('ep.3-0', 'other', 'e3'),
    );
    await waitFor(() => cursorOf(storage) === 'ep.3-0');

    expect(named).toHaveBeenCalledTimes(2);
    expect(all).toHaveBeenCalledTimes(3);
    expect(filtered.mock.calls.map(([event]) => event.eventId)).toEqual(['e1']);
  });

  it('can stop during a handler without advancing the cursor', async () => {
    const { client, streams, storage } = createClient();
    let signal: AbortSignal;
    client.on('test-service:test-started', (_event, context) => {
      signal = context.signal;
      return new Promise((_resolve, reject) => context.signal.addEventListener('abort', () => reject(new Error('aborted'))));
    });

    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push(ready('ep.1-0') + frame('ep.2-0', 'test-started', 'e1'));
    await waitFor(() => !!signal);
    client.stop();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(signal.aborted).toBe(true);
    expect(cursorOf(storage)).toBe('ep.1-0');
    expect(client.getStatus()).toBe('idle');
  });

  it('can bound the de-duplication window', async () => {
    const { client, streams, storage } = createClient({ dedupeSize: 1 });
    const handler = jest.fn();
    client.on('test-service:test-started', handler);
    client.start();
    await waitFor(() => streams.length === 1);
    streams[0].push(
      frame('ep.1-0', 'test-started', 'e1') + frame('ep.2-0', 'test-started', 'e2') + frame('ep.3-0', 'test-started', 'e1'),
    );
    await waitFor(() => cursorOf(storage) === 'ep.3-0');
    // e1 fell out of the window, so it's handled again (at least once).
    expect(handler).toHaveBeenCalledTimes(3);
  });
});
