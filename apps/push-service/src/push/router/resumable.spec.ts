import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { EventEmitter } from 'events';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { BufferedEvent, BufferTailer, RedisEventBuffer } from '../../buffer';
import { StreamEntity } from '../model';
import { getStreamEvents, subscribeBySseResumable } from './resumable';

describe('resumable stream', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn() } as unknown as Logger;
  const options = { keepAliveMs: 1000, replayPageSize: 2 };

  const createStream = (publicSubscribe = true, streamTenantId = tenantId) =>
    new StreamEntity(logger, streamTenantId, {
      id: 'test',
      name: 'Test',
      description: null,
      subscriberRoles: [],
      publicSubscribe,
      events: [{ namespace: 'test-service', name: 'test-started' }],
    });

  const entry = (entryId: string, name = 'test-started', id = `event-${entryId}`): BufferedEvent => ({
    entryId,
    event: { id, namespace: 'test-service', name, tenantId, timestamp: new Date(), payload: {} },
  });

  let listener: (entry: BufferedEvent) => void;
  const removeListener = jest.fn();
  const tailer = {
    listen: jest.fn(async (_tenantId, l) => {
      listener = l;
      return removeListener;
    }),
  } as unknown as BufferTailer;

  const buffer = {
    getEpoch: jest.fn(),
    getHead: jest.fn(),
    isTrimmedAfter: jest.fn(),
    readAfter: jest.fn(),
  };

  const responses: EventEmitter[] = [];
  afterEach(() => {
    // Clears keepalive timers.
    responses.splice(0).forEach((res) => res.emit('close'));
  });

  function createResponse() {
    const res = new EventEmitter() as EventEmitter & Record<string, jest.Mock> & { headersSent: boolean };
    res.write = jest.fn();
    res.flush = jest.fn();
    res.set = jest.fn();
    res.end = jest.fn();
    res.send = jest.fn();
    res.headersSent = false;
    res.flushHeaders = jest.fn(() => (res.headersSent = true));
    responses.push(res);
    return res;
  }

  function createRequest(stream: StreamEntity, cursor?: string, user?: Partial<User>, query = {}) {
    return {
      user,
      query,
      stream,
      get: jest.fn((name) => (name === 'Last-Event-ID' ? cursor : undefined)),
    } as unknown as Request;
  }

  const frames = (res: ReturnType<typeof createResponse>) => res.write.mock.calls.map(([text]) => text as string);

  beforeEach(() => {
    jest.clearAllMocks();
    buffer.getEpoch.mockResolvedValue('epoch');
    buffer.getHead.mockResolvedValue('10-0');
    buffer.isTrimmedAfter.mockResolvedValue(false);
    buffer.readAfter.mockResolvedValue([]);
  });

  const handler = () =>
    subscribeBySseResumable(logger, buffer as unknown as RedisEventBuffer, tailer, options);

  it('can start at head without cursor, then deliver live entries', async () => {
    const res = createResponse();
    const next = jest.fn();
    await handler()(createRequest(createStream()), res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'text/event-stream' }));
    expect(frames(res)).toEqual([
      'event: adsp:ready\nid: epoch.10-0\ndata: {"cursor":"epoch.10-0","replayed":0}\n\n',
    ]);

    listener(entry('11-0'));
    listener(entry('12-0', 'other-event'));
    listener(entry('11-0'));
    const live = frames(res).slice(1);
    expect(live).toHaveLength(1);
    expect(live[0]).toMatch(/^id: epoch\.11-0\ndata: .*"eventId":"event-11-0"/);

    res.emit('close');
    expect(removeListener).toHaveBeenCalled();
  });

  it('can replay from cursor in pages, then merge pending live entries', async () => {
    buffer.readAfter
      .mockImplementationOnce(async () => {
        // Appended while replaying: arrives via the tail, and is also in the next page.
        listener(entry('7-0'));
        return [entry('5-0'), entry('6-0', 'other-event')];
      })
      .mockResolvedValueOnce([entry('7-0')]);

    const res = createResponse();
    await handler()(createRequest(createStream(), 'epoch.4-0'), res as unknown as Response, jest.fn());

    expect(buffer.readAfter).toHaveBeenNthCalledWith(1, tenantId, '4-0', 2);
    expect(buffer.readAfter).toHaveBeenNthCalledWith(2, tenantId, '6-0', 2);
    const written = frames(res);
    expect(written.map((f) => f.split('\n')[0])).toEqual(['id: epoch.5-0', 'id: epoch.7-0', 'event: adsp:ready']);
    expect(written[2]).toContain('"replayed":2');
    expect(written[2]).toContain('id: epoch.7-0');
  });

  it('can accept cursor from after query parameter', async () => {
    const res = createResponse();
    await handler()(createRequest(createStream(), undefined, undefined, { after: 'epoch.4-0' }), res as unknown as Response, jest.fn());
    expect(buffer.readAfter).toHaveBeenCalledWith(tenantId, '4-0', 2);
  });

  it.each([
    ['garbage', 'invalid-cursor', false],
    ['old-epoch.4-0', 'epoch-changed', false],
    ['epoch.4-0', 'cursor-expired', true],
  ])('can reset for cursor %p (%p)', async (cursor, reason, trimmed) => {
    buffer.isTrimmedAfter.mockResolvedValue(trimmed);
    const res = createResponse();
    await handler()(createRequest(createStream(), cursor), res as unknown as Response, jest.fn());

    const written = frames(res);
    expect(written[0]).toBe(`event: adsp:reset\ndata: {"reason":"${reason}"}\n\n`);
    expect(written[1]).toContain('id: epoch.10-0');
    expect(buffer.readAfter).not.toHaveBeenCalled();
  });

  it('can reject unauthorized user before sending headers', async () => {
    const res = createResponse();
    const next = jest.fn();
    await handler()(createRequest(createStream(false)), res as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    expect(res.flushHeaders).not.toHaveBeenCalled();
    expect(tailer.listen).not.toHaveBeenCalled();
  });

  it('can reject invalid criteria', async () => {
    const res = createResponse();
    const next = jest.fn();
    await handler()(createRequest(createStream(), undefined, undefined, { criteria: '{' }), res as unknown as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
  });

  it('can end response on error after headers are sent', async () => {
    buffer.readAfter.mockRejectedValueOnce(new Error('redis down'));
    const res = createResponse();
    const next = jest.fn();
    await handler()(createRequest(createStream(), 'epoch.4-0'), res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalled();
  });

  it('can ask the client to reconnect when the token expires', async () => {
    jest.useFakeTimers();
    try {
      const res = createResponse();
      const user = { id: 'user', name: 'User', token: { exp: Date.now() / 1000 + 5 } } as unknown as User;
      await handler()(createRequest(createStream(), undefined, user), res as unknown as Response, jest.fn());

      jest.advanceTimersByTime(1000);
      expect(frames(res)).toContain(': keepalive\n\n');
      expect(res.end).not.toHaveBeenCalled();

      jest.advanceTimersByTime(5000);
      expect(frames(res)).toContainEqual(expect.stringContaining('event: adsp:reconnect'));
      expect(res.end).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  describe('getStreamEvents', () => {
    it('can read items after cursor', async () => {
      buffer.readAfter.mockResolvedValueOnce([entry('5-0'), entry('6-0', 'other-event')]);
      const res = createResponse();
      await getStreamEvents(buffer as unknown as RedisEventBuffer, 100)(
        createRequest(createStream(), undefined, undefined, { after: 'epoch.4-0', top: '10' }),
        res as unknown as Response,
        jest.fn(),
      );

      expect(buffer.readAfter).toHaveBeenCalledWith(tenantId, '4-0', 10);
      const body = res.send.mock.calls[0][0];
      expect(body.reset).toBeNull();
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toEqual(expect.objectContaining({ cursor: 'epoch.5-0', eventId: 'event-5-0' }));
      expect(body.next).toBe('epoch.6-0');
    });

    it('can return head without cursor', async () => {
      const res = createResponse();
      await getStreamEvents(buffer as unknown as RedisEventBuffer, 100)(
        createRequest(createStream()),
        res as unknown as Response,
        jest.fn(),
      );
      expect(res.send).toHaveBeenCalledWith({ reset: null, items: [], next: 'epoch.10-0' });
    });

    it('can reject cross-tenant stream', async () => {
      const next = jest.fn();
      await getStreamEvents(buffer as unknown as RedisEventBuffer, 100)(
        createRequest(createStream(true, null), undefined, { isCore: true, roles: ['stream-listener'] }),
        createResponse() as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });
});
