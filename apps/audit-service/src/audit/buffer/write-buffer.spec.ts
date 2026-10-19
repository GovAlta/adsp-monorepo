import { metrics } from '@opentelemetry/api';
import { randomUUID } from 'crypto';
import { createLogger, transports } from 'winston';
import type { EnrichedEvent } from '../types';
import { PARK_TIMEOUT_MS, WRITE_TIMEOUT_MS } from './durable-writer';
import { AuditEventStore, AuditStorageUnavailableError, AuditStoreError } from './store';
import {
  AuditWriteBuffer,
  MAX_BUFFERED_EVENTS,
  SHUTDOWN_TIMEOUT_MS,
  WRITE_BATCH_SIZE,
  WRITE_BATCH_WINDOW_MS,
  WriteBufferOptions,
} from './write-buffer';

function createEvent(overrides: Partial<EnrichedEvent> = {}): EnrichedEvent {
  const eventId = randomUUID();
  const occurredAt = new Date('2026-10-16T16:00:00Z');
  return {
    id: randomUUID(),
    event_id: eventId,
    tenant_id: 'urn:ads:platform:tenant-service:v2:/tenants/case-team',
    namespace: 'case-service',
    written_by: 'urn:ads:case-team:case-service',
    occurred_at: occurredAt,
    received_at: new Date('2026-10-16T16:00:01Z'),
    action: 'case.update',
    action_version: 1,
    category: 'administrative',
    status: 'success',
    severity: 'info',
    actor_id: 'case-worker',
    actor_type: 'user',
    actor_name: null,
    actor_email: null,
    actor_roles: [],
    resource_type: 'case',
    resource_id: 'CASE-1042',
    resource_name: null,
    scope_ids: [],
    correlation_id: null,
    session_id: null,
    metadata: { reasonCode: 'RESOLVED' },
    change_set_before: null,
    change_set_after: null,
    retention_class: 'compliance',
    retention_until: new Date('2027-10-16T16:00:00Z'),
    originalEvent: {
      eventId,
      occurredAt: occurredAt.toISOString(),
      action: 'case.update.succeeded',
      status: 'success',
      actor: { id: 'case-worker', type: 'user' },
      changeSet: { before: { status: 'open' }, after: { status: 'closed' } },
      customInput: 'Preserved before enrichment',
    },
    ...overrides,
  };
}

function createEvents(count: number): EnrichedEvent[] {
  return Array.from({ length: count }, () => createEvent());
}

function deferred<T>() {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

describe('AuditWriteBuffer', () => {
  const logger = createLogger({
    levels: { critical: 0, error: 1, warn: 2, info: 3 },
    transports: [new transports.Console({ silent: true })],
  });
  const store: jest.Mocked<AuditEventStore> = { insert: jest.fn(), park: jest.fn() };
  const depthAdd = jest.fn();
  const bytesAdd = jest.fn();
  const failuresAdd = jest.fn();
  const meter = metrics.getMeter('audit-buffer-test');
  let buffer: AuditWriteBuffer;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    jest.spyOn(logger, 'log');
    jest.spyOn(meter, 'createUpDownCounter').mockImplementation((name) => ({
      add: name === 'audit_buffer_depth' ? depthAdd : bytesAdd,
    }));
    jest.spyOn(meter, 'createCounter').mockReturnValue({ add: failuresAdd });
    store.insert.mockImplementation(async (events) => events.map(({ id }) => id));
    store.park.mockResolvedValue(undefined);
    buffer = new AuditWriteBuffer(store, logger, {}, meter);
  });

  afterEach(async () => {
    const closing = Promise.allSettled([buffer.close()]);
    await jest.runAllTimersAsync();
    await closing;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('coalesces concurrent submissions in one committed insert', async () => {
    const first = createEvent();
    const second = createEvent();

    const firstResult = buffer.submit([first]);
    const secondResult = buffer.submit([second]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);

    expect(store.insert).toHaveBeenCalledTimes(1);
    expect(store.insert.mock.calls[0][0]).toEqual([first, second]);
    await expect(firstResult).resolves.toEqual(new Map([[first.id, { status: 'accepted' }]]));
    await expect(secondResult).resolves.toEqual(new Map([[second.id, { status: 'accepted' }]]));
  });

  it('flushes exactly 200 events without waiting for the 200 ms window', async () => {
    const events = createEvents(WRITE_BATCH_SIZE);

    const result = buffer.submit(events);
    await jest.advanceTimersByTimeAsync(0);

    expect(store.insert).toHaveBeenCalledTimes(1);
    expect(store.insert.mock.calls[0][0]).toHaveLength(WRITE_BATCH_SIZE);
    await expect(result).resolves.toHaveProperty('size', WRITE_BATCH_SIZE);
  });

  it('does not flush 199 events before the oldest event is 200 ms old', async () => {
    const result = buffer.submit(createEvents(WRITE_BATCH_SIZE - 1));

    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS - 1);
    expect(store.insert).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);

    await expect(result).resolves.toHaveProperty('size', WRITE_BATCH_SIZE - 1);
  });

  it('does not restart the oldest-event timer when another request arrives', async () => {
    const firstResult = buffer.submit([createEvent()]);
    await jest.advanceTimersByTimeAsync(100);

    const secondResult = buffer.submit([createEvent()]);
    await jest.advanceTimersByTimeAsync(100);
    await Promise.all([firstResult, secondResult]);

    expect(store.insert).toHaveBeenCalledTimes(1);
    expect(store.insert.mock.calls[0][0]).toHaveLength(2);
  });

  it('holds a request open until its insert has committed', async () => {
    const commit = deferred<readonly string[]>();
    const event = createEvent();
    store.insert.mockReturnValueOnce(commit.promise);
    const acknowledged = jest.fn();

    const result = buffer.submit([event]).then(acknowledged);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    expect(acknowledged).not.toHaveBeenCalled();
    expect(buffer.isReady).toBe(true);
    commit.resolve([event.id]);
    await result;

    expect(acknowledged).toHaveBeenCalledWith(new Map([[event.id, { status: 'accepted' }]]));
  });

  it('splits 500 events into 200, 200 and 100 and reserves the whole request until completion', async () => {
    const events = createEvents(500);
    const acknowledged = jest.fn();

    const result = buffer.submit(events).then(acknowledged);
    await jest.advanceTimersByTimeAsync(0);
    expect(store.insert.mock.calls.map(([batch]) => batch.length)).toEqual([200, 200]);
    expect(buffer.depth).toBe(500);
    expect(acknowledged).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await result;

    expect(store.insert.mock.calls.map(([batch]) => batch.length)).toEqual([200, 200, 100]);
    expect(acknowledged).toHaveBeenCalledWith(new Map(events.map(({ id }) => [id, { status: 'accepted' }])));
    expect(buffer.depth).toBe(0);
  });

  it('flushes an aged partial batch immediately after a slow previous insert finishes', async () => {
    const firstEvents = createEvents(WRITE_BATCH_SIZE);
    const commit = deferred<readonly string[]>();
    store.insert.mockReturnValueOnce(commit.promise);
    const firstResult = buffer.submit(firstEvents);
    const secondResult = buffer.submit([createEvent()]);
    await jest.advanceTimersByTimeAsync(500);

    commit.resolve(firstEvents.map(({ id }) => id));
    await jest.advanceTimersByTimeAsync(0);
    await Promise.all([firstResult, secondResult]);

    expect(store.insert.mock.calls.map(([batch]) => batch.length)).toEqual([200, 1]);
  });

  it('attributes overlapping client event IDs by inserted service ID across tenants and namespaces', async () => {
    const first = createEvent();
    const sameKey = createEvent({ event_id: first.event_id });
    const otherTenant = createEvent({ event_id: first.event_id, tenant_id: 'payment-team' });
    const otherNamespace = createEvent({ event_id: first.event_id, namespace: 'payment-service' });
    store.insert.mockResolvedValueOnce([first.id, otherTenant.id, otherNamespace.id]);

    const results = [
      buffer.submit([first]),
      buffer.submit([sameKey]),
      buffer.submit([otherTenant]),
      buffer.submit([otherNamespace]),
    ];
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);

    await expect(Promise.all(results)).resolves.toEqual([
      new Map([[first.id, { status: 'accepted' }]]),
      new Map([[sameKey.id, { status: 'duplicate' }]]),
      new Map([[otherTenant.id, { status: 'accepted' }]]),
      new Map([[otherNamespace.id, { status: 'accepted' }]]),
    ]);
    expect(store.insert.mock.calls[0][0]).toHaveLength(4);
  });

  it('reports only events omitted from the committed returning set as duplicates', async () => {
    const [stored, fresh] = createEvents(2);
    store.insert.mockResolvedValueOnce([fresh.id]);

    const result = buffer.submit([stored, fresh]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);

    await expect(result).resolves.toEqual(
      new Map([
        [stored.id, { status: 'duplicate' }],
        [fresh.id, { status: 'accepted' }],
      ]),
    );
    expect(store.park).not.toHaveBeenCalled();
  });

  it('reports a replay as duplicate without checking for existence in the buffer', async () => {
    const event = createEvent();
    const first = buffer.submit([event]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await first;
    const replay = createEvent({ event_id: event.event_id });
    store.insert.mockResolvedValueOnce([]);

    const result = buffer.submit([replay]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);

    await expect(result).resolves.toEqual(new Map([[replay.id, { status: 'duplicate' }]]));
    expect(store.insert).toHaveBeenCalledTimes(2);
  });

  it('retries transient failures at 200 ms, 1 s and 3 s before parking', async () => {
    store.insert.mockRejectedValue(new AuditStoreError('Database unreachable', 'transient'));
    const event = createEvent();
    const result = buffer.submit([event]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    expect(store.insert).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(199);
    expect(store.insert).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(store.insert).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(999);
    expect(store.insert).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(1);
    expect(store.insert).toHaveBeenCalledTimes(3);
    await jest.advanceTimersByTimeAsync(2999);
    expect(store.insert).toHaveBeenCalledTimes(3);
    await jest.advanceTimersByTimeAsync(1);

    expect(store.insert).toHaveBeenCalledTimes(4);
    expect(store.park.mock.calls[0][0][0]).toMatchObject({ attempt_count: 4, status: 'open' });
    await expect(result).resolves.toEqual(
      new Map([[event.id, { status: 'rejected', code: 'storage_failed', reason: expect.any(String) }]]),
    );
  });

  it('recovers readiness and accepts an event when the retry commits', async () => {
    store.insert.mockRejectedValueOnce(new AuditStoreError('Connection refused', 'transient'));
    const event = createEvent();
    const result = buffer.submit([event]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    expect(buffer.isReady).toBe(false);

    await jest.advanceTimersByTimeAsync(200);

    await expect(result).resolves.toEqual(new Map([[event.id, { status: 'accepted' }]]));
    expect(buffer.isReady).toBe(true);
    expect(store.park).not.toHaveBeenCalled();
  });

  it('reports duplicate if a retry finds that an ambiguous first commit was already stored', async () => {
    store.insert
      .mockRejectedValueOnce(new AuditStoreError('Connection lost after commit', 'transient'))
      .mockResolvedValueOnce([]);
    const event = createEvent();

    const result = buffer.submit([event]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS + 200);

    await expect(result).resolves.toEqual(new Map([[event.id, { status: 'duplicate' }]]));
    expect(store.insert.mock.calls.map(([batch]) => batch[0].id)).toEqual([event.id, event.id]);
  });

  it('isolates a poison row from 199 valid events and preserves its original input for replay', async () => {
    const events = createEvents(WRITE_BATCH_SIZE);
    const poison = events[0];
    const constraint = new AuditStoreError('Check constraint failed', 'constraint');
    store.insert.mockRejectedValueOnce(constraint).mockRejectedValueOnce(constraint);

    const result = buffer.submit(events);
    await jest.advanceTimersByTimeAsync(0);
    const outcomes = await result;

    expect([...outcomes.values()].filter(({ status }) => status === 'accepted')).toHaveLength(199);
    expect(outcomes.get(poison.id)).toMatchObject({ status: 'rejected', code: 'storage_failed' });
    expect(store.insert).toHaveBeenCalledTimes(201);
    expect(store.park.mock.calls[0][0]).toEqual([
      {
        id: poison.id,
        tenant_id: poison.tenant_id,
        namespace: poison.namespace,
        event_id: poison.event_id,
        event: poison.originalEvent,
        error: constraint.message,
        attempt_count: 2,
        failed_at: expect.any(Date),
        status: 'open',
      },
    ]);
  });

  it('waits for the failed-events transaction before returning storage_failed', async () => {
    const commit = deferred<void>();
    store.insert.mockRejectedValue(new AuditStoreError('Column cannot be stored', 'permanent'));
    store.park.mockReturnValueOnce(commit.promise);
    const event = createEvent();
    const acknowledged = jest.fn();

    const result = buffer.submit([event]).then(acknowledged);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    expect(acknowledged).not.toHaveBeenCalled();
    commit.resolve(undefined);
    await result;

    expect(acknowledged).toHaveBeenCalledWith(
      new Map([[event.id, { status: 'rejected', code: 'storage_failed', reason: expect.any(String) }]]),
    );
  });

  it('rejects the request and records a critical failure if neither table can be written', async () => {
    store.insert.mockRejectedValue(new AuditStoreError('Audit table unavailable', 'permanent'));
    store.park.mockRejectedValue(new AuditStoreError('Failed-events table unavailable', 'permanent'));
    const result = expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);

    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await result;

    expect(failuresAdd).toHaveBeenCalledWith(1);
    expect(logger.log).toHaveBeenCalledWith(
      'critical',
      expect.any(String),
      expect.objectContaining({
        severity: 'critical',
        eventCount: 1,
      }),
    );
    expect(buffer.isReady).toBe(false);
  });

  it('resumes writes without restart after an outage has ended', async () => {
    store.insert.mockRejectedValueOnce(new AuditStoreError('Audit table unavailable', 'permanent'));
    store.park.mockRejectedValueOnce(new AuditStoreError('Failed-events table unavailable', 'permanent'));
    const failure = expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await failure;
    const event = createEvent();

    const result = buffer.submit([event]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);

    await expect(result).resolves.toEqual(new Map([[event.id, { status: 'accepted' }]]));
    expect(buffer.isReady).toBe(true);
  });

  it('bounds a stuck write and refuses additional work until the cancelled operation actually settles', async () => {
    const commit = deferred<readonly string[]>();
    const event = createEvent();
    store.insert.mockReturnValueOnce(commit.promise);
    const failed = expect(buffer.submit([event])).rejects.toBeInstanceOf(AuditStorageUnavailableError);

    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS + WRITE_TIMEOUT_MS);
    await failed;
    await expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    expect(store.park).not.toHaveBeenCalled();
    expect(store.insert.mock.calls[0][1].signal.aborted).toBe(true);
    expect(buffer.isReady).toBe(false);
    commit.resolve([event.id]);
    await jest.advanceTimersByTimeAsync(0);
    const resumed = buffer.submit([createEvent()]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);

    await expect(resumed).resolves.toHaveProperty('size', 1);
  });

  it('bounds a stuck failed-events write without acknowledging it', async () => {
    const commit = deferred<void>();
    store.insert.mockRejectedValueOnce(new AuditStoreError('Primary storage failed', 'permanent'));
    store.park.mockReturnValueOnce(commit.promise);
    const result = expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);

    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS + PARK_TIMEOUT_MS);
    await result;
    commit.reject(new Error('Late cancellation'));
    await jest.advanceTimersByTimeAsync(0);

    expect(failuresAdd).toHaveBeenCalledTimes(1);
    expect(store.park.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it('does not report a clean shutdown while a previously timed-out adapter still holds an operation', async () => {
    const commit = deferred<readonly string[]>();
    store.insert.mockReturnValueOnce(commit.promise);
    const result = expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS + WRITE_TIMEOUT_MS);
    await result;

    await expect(buffer.close()).rejects.toMatchObject({
      message: 'A cancelled audit storage operation has not stopped.',
    });
    commit.resolve([]);
    await jest.advanceTimersByTimeAsync(0);

    expect(buffer.isReady).toBe(false);
  });

  it('rejects a missing returning set instead of treating it as all duplicates', async () => {
    store.insert.mockResolvedValueOnce(undefined);
    const result = expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);

    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await result;

    expect(store.park).not.toHaveBeenCalled();
  });

  it.each(['unknown', 'repeated'])('rejects a %s inserted service ID instead of inventing outcomes', async (kind) => {
    const event = createEvent();
    const returned = { unknown: [randomUUID()], repeated: [event.id, event.id] };
    store.insert.mockResolvedValueOnce(returned[kind]);
    const result = expect(buffer.submit([event])).rejects.toBeInstanceOf(AuditStorageUnavailableError);

    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await result;

    expect(store.park).not.toHaveBeenCalled();
  });

  it('caps retained events at 5000 including events already being written', async () => {
    const events = createEvents(MAX_BUFFERED_EVENTS);
    const commit = deferred<readonly string[]>();
    store.insert.mockReturnValueOnce(commit.promise);
    const result = buffer.submit(events);
    await jest.advanceTimersByTimeAsync(0);

    await expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    expect(buffer.depth).toBe(MAX_BUFFERED_EVENTS);
    expect(store.insert).toHaveBeenCalledTimes(1);
    commit.resolve(events.slice(0, WRITE_BATCH_SIZE).map(({ id }) => id));
    await jest.advanceTimersByTimeAsync(0);
    await result;

    expect(buffer.depth).toBe(0);
    expect(store.insert.mock.calls.flatMap(([batch]) => batch)).toEqual(events);
  });

  it('rejects a whole request before enqueueing any of it when capacity is insufficient', async () => {
    buffer = new AuditWriteBuffer(store, logger, { maxEvents: 3 }, meter);
    const admitted = createEvents(2);
    const result = buffer.submit(admitted);

    await expect(buffer.submit(createEvents(2))).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await result;

    expect(store.insert.mock.calls[0][0]).toEqual(admitted);
    expect(depthAdd.mock.calls).toEqual([[2], [-2]]);
  });

  it('accepts new requests again after capacity is released', async () => {
    buffer = new AuditWriteBuffer(store, logger, { maxEvents: 1 }, meter);
    const first = buffer.submit([createEvent()]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await first;

    const second = buffer.submit([createEvent()]);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);

    await expect(second).resolves.toHaveProperty('size', 1);
  });

  it('enforces byte capacity using both enriched fields and original input', async () => {
    const first = createEvent({ originalEvent: { message: '\u5ba1\u8ba1\u4e8b\u4ef6' } });
    const bytes = Buffer.byteLength(JSON.stringify(first), 'utf8');
    buffer = new AuditWriteBuffer(store, logger, { maxBytes: bytes }, meter);
    const result = buffer.submit([first]);

    expect(buffer.bufferedBytes).toBe(bytes);
    await expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await result;

    expect(buffer.bufferedBytes).toBe(0);
    expect(bytesAdd.mock.calls).toEqual([[bytes], [-bytes]]);
  });

  it('refuses unmeasurable input without retaining a partial submission', async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    await expect(buffer.submit([createEvent(), createEvent({ originalEvent: circular })])).rejects.toBeInstanceOf(
      AuditStorageUnavailableError,
    );

    expect(buffer.depth).toBe(0);
    expect(store.insert).not.toHaveBeenCalled();
  });

  it('refuses repeated internal IDs within a submission without storing any row', async () => {
    const event = createEvent();

    await expect(buffer.submit([event, event])).rejects.toBeInstanceOf(AuditStorageUnavailableError);

    expect(buffer.depth).toBe(0);
    expect(store.insert).not.toHaveBeenCalled();
  });

  it('refuses an internal ID already reserved by another request', async () => {
    const event = createEvent();
    const result = buffer.submit([event]);

    await expect(buffer.submit([event])).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    await jest.advanceTimersByTimeAsync(WRITE_BATCH_WINDOW_MS);
    await result;

    expect(store.insert.mock.calls[0][0]).toEqual([event]);
  });

  it('returns an empty result without starting a timer for an empty submission', async () => {
    await expect(buffer.submit([])).resolves.toEqual(new Map());

    expect(jest.getTimerCount()).toBe(0);
    expect(buffer.depth).toBe(0);
  });

  it.each<WriteBufferOptions>([
    { maxEvents: 0 },
    { maxEvents: 5001 },
    { maxEvents: 1.5 },
    { maxBytes: 0 },
    { maxBytes: Number.NaN },
    { shutdownTimeoutMs: PARK_TIMEOUT_MS },
    { shutdownTimeoutMs: 30000 },
  ])('rejects invalid buffer configuration %j', (options) => {
    expect(() => new AuditWriteBuffer(store, logger, options)).toThrow('Invalid audit buffer limits');
  });

  it('becomes unready synchronously on shutdown before refusing new writes', async () => {
    const closing = buffer.close();

    expect(buffer.isReady).toBe(false);
    await expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    await closing;

    expect(store.insert).not.toHaveBeenCalled();
  });

  it('flushes a partial buffer immediately on shutdown and waits for commit', async () => {
    const event = createEvent();
    const commit = deferred<readonly string[]>();
    store.insert.mockReturnValueOnce(commit.promise);
    const result = buffer.submit([event]);
    const closed = jest.fn();

    const closing = buffer.close().then(closed);
    await jest.advanceTimersByTimeAsync(0);
    expect(store.insert).toHaveBeenCalledTimes(1);
    expect(closed).not.toHaveBeenCalled();
    commit.resolve([event.id]);
    await closing;

    await expect(result).resolves.toEqual(new Map([[event.id, { status: 'accepted' }]]));
    expect(closed).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('returns the same shutdown promise on repeated close calls', async () => {
    const result = buffer.submit([createEvent()]);

    const first = buffer.close();
    const second = buffer.close();
    await jest.advanceTimersByTimeAsync(0);
    await Promise.all([result, first]);

    expect(first).toBe(second);
    expect(store.insert).toHaveBeenCalledTimes(1);
  });

  it('parks in-flight and queued events when the shutdown write window expires', async () => {
    buffer = new AuditWriteBuffer(store, logger, { shutdownTimeoutMs: 6000 }, meter);
    const events = createEvents(250);
    store.insert.mockImplementationOnce(
      (_events, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('Write cancelled')), { once: true });
        }),
    );
    const result = buffer.submit(events);
    const closing = buffer.close();

    await jest.advanceTimersByTimeAsync(1000);
    await closing;
    const outcomes = await result;

    expect([...outcomes.values()]).toEqual(
      events.map(() => ({
        status: 'rejected',
        code: 'storage_failed',
        reason: expect.any(String),
      })),
    );
    expect(store.insert).toHaveBeenCalledTimes(1);
    expect(store.park.mock.calls.map(([batch]) => batch.length)).toEqual([200, 50]);
    expect(store.park.mock.calls[1][0][0].attempt_count).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('rejects shutdown and pending requests at the hard deadline if parking cannot finish', async () => {
    buffer = new AuditWriteBuffer(store, logger, { shutdownTimeoutMs: 6000 }, meter);
    const commit = deferred<void>();
    store.insert.mockImplementationOnce(
      (_events, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('Write cancelled')), { once: true });
        }),
    );
    store.park.mockReturnValueOnce(commit.promise);
    const submission = expect(buffer.submit(createEvents(250))).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    const closing = expect(buffer.close()).rejects.toMatchObject({
      message: 'Audit shutdown expired with unacknowledged events.',
    });

    await jest.advanceTimersByTimeAsync(6000);
    await Promise.all([submission, closing]);
    commit.resolve(undefined);
    await jest.advanceTimersByTimeAsync(0);

    expect(buffer.isReady).toBe(false);
    expect(buffer.depth).toBe(0);
    expect(logger.log).toHaveBeenCalledWith(
      'critical',
      expect.any(String),
      expect.objectContaining({
        severity: 'critical',
        eventCount: expect.any(Number),
      }),
    );
    expect(failuresAdd.mock.calls.reduce((sum, [count]) => sum + count, 0)).toBe(250);
  });

  it('does not report a clean shutdown when a draining batch could not be stored anywhere', async () => {
    store.insert.mockRejectedValueOnce(new AuditStoreError('No primary table', 'permanent'));
    store.park.mockRejectedValueOnce(new AuditStoreError('No failed-events table', 'permanent'));
    const submission = expect(buffer.submit([createEvent()])).rejects.toBeInstanceOf(AuditStorageUnavailableError);
    const closing = expect(buffer.close()).rejects.toBeInstanceOf(AuditStorageUnavailableError);

    await jest.advanceTimersByTimeAsync(0);

    await Promise.all([submission, closing]);
    expect(buffer.isReady).toBe(false);
  });

  it('documents a shutdown budget below the deployment grace period with time reserved for parking', () => {
    expect(SHUTDOWN_TIMEOUT_MS).toBe(25000);
    expect(SHUTDOWN_TIMEOUT_MS - PARK_TIMEOUT_MS).toBe(20000);
  });
});
