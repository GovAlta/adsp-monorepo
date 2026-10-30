import axios from 'axios';
import {
  MeterProvider,
  AggregationTemporality,
  InMemoryMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { createLogger, transports } from 'winston';
import { adspId } from '../utils';
import { AuditServiceImpl } from './auditService';
import { AuditAction } from './definitions';
import { AuditRecordDetails } from './types';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;
const { AxiosError, AxiosHeaders } = jest.requireActual('axios');
axiosMock.isAxiosError.mockImplementation(jest.requireActual('axios').isAxiosError);

describe('AuditServiceImpl', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const serviceId = adspId`urn:ads:platform:case-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/other`;
  const directory = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(async (id) => new URL(`https://audit.example.test/audit/v1${id.resource}`)),
  };
  const tokenProvider = { getAccessToken: jest.fn(async () => 'service-token') };
  const action: AuditAction = {
    name: 'case.update',
    version: 2,
    category: 'administrative',
    severity: 'info',
    retentionClass: 'compliance',
  };
  const details: AuditRecordDetails = { actor: { id: 'user-1', type: 'user' } };
  const fast = { batchIntervalMs: 5, retryDelaysMs: [1, 1] };

  function accept(accepted: number, rejected = []) {
    return { data: { accepted, duplicates: 0, rejected } };
  }

  function httpError(status?: number, headers: Record<string, string> = {}) {
    const response = status
      ? {
          status,
          data: { errorMessage: 'unavailable' },
          headers: new AxiosHeaders(headers),
          statusText: '',
          config: {},
        }
      : undefined;
    return new AxiosError('request failed', status ? undefined : 'ECONNRESET', undefined, undefined, response);
  }

  function create(isCore = false, options = {}) {
    return new AuditServiceImpl(isCore, logger, directory, tokenProvider, serviceId, { ...fast, ...options });
  }

  function sentEvents(call = 0) {
    return (axiosMock.post.mock.calls[call][1] as { events: Record<string, unknown>[] }).events;
  }

  beforeEach(() => {
    axiosMock.post.mockReset();
    axiosMock.get.mockReset();
    directory.getResourceUrl.mockClear();
    tokenProvider.getAccessToken.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('record', () => {
    it('sends each event immediately by default without a batch timer or flush', async () => {
      jest.useFakeTimers();
      axiosMock.post.mockResolvedValue(accept(1));
      const service = new AuditServiceImpl(false, logger, directory, tokenProvider, serviceId);

      const outcomes = await Promise.all([service.record(action, details), service.record(action, details)]);

      expect(outcomes).toEqual([
        expect.objectContaining({ status: 'recorded' }),
        expect.objectContaining({ status: 'recorded' }),
      ]);
      expect(axiosMock.post).toHaveBeenCalledTimes(2);
      expect(sentEvents(0)).toHaveLength(1);
      expect(sentEvents(1)).toHaveLength(1);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('waits for the service response before resolving an immediate write', async () => {
      jest.useFakeTimers();
      let confirm: (response: ReturnType<typeof accept>) => void;
      axiosMock.post.mockReturnValueOnce(new Promise((resolve) => (confirm = resolve)));
      const service = new AuditServiceImpl(false, logger, directory, tokenProvider, serviceId);
      const settled = jest.fn();

      const outcome = service.record(action, details);
      outcome.then(settled);
      await jest.advanceTimersByTimeAsync(0);

      expect(axiosMock.post).toHaveBeenCalledTimes(1);
      expect(settled).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
      confirm(accept(1));
      await expect(outcome).resolves.toMatchObject({ status: 'recorded' });
    });

    it('writes an event to the namespace URL resolved from the directory and resolves with its outcome', async () => {
      axiosMock.post.mockResolvedValueOnce(accept(1));
      const occurredAt = new Date('2026-10-26T12:00:00Z');

      const outcome = await create().record(action, {
        ...details,
        occurredAt,
        resource: { type: 'case', id: 'c-1' },
        metadata: { reason: 'review' },
      });

      expect(outcome).toEqual({ status: 'recorded', eventId: expect.any(String) });
      expect(directory.getResourceUrl.mock.calls[0][0].toString()).toBe(
        'urn:ads:platform:audit-service:v1:/case-service/events',
      );
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://audit.example.test/audit/v1/case-service/events',
        { events: [expect.any(Object)] },
        expect.objectContaining({ headers: { Authorization: 'Bearer service-token' }, params: undefined }),
      );
      expect(sentEvents()[0]).toMatchObject({
        eventId: outcome.eventId,
        occurredAt: '2026-10-26T12:00:00.000Z',
        action: 'case.update',
        actionVersion: 2,
        status: 'success',
        actor: { id: 'user-1', type: 'user' },
        resource: { type: 'case', id: 'c-1' },
        metadata: { reason: 'review' },
      });
    });

    it('uses a caller supplied eventId and status', async () => {
      axiosMock.post.mockResolvedValueOnce(accept(1));
      const eventId = '0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11';

      const outcome = await create().record(action, { ...details, eventId, status: 'failure' });

      expect(outcome).toEqual({ status: 'recorded', eventId });
      expect(sentEvents()[0]).toMatchObject({ eventId, status: 'failure' });
    });

    it('treats a duplicate as recorded', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { accepted: 0, duplicates: 1, rejected: [] } });

      await expect(create().record(action, details)).resolves.toMatchObject({ status: 'recorded' });
    });

    it('drops the change set of a non-capturing action before sending', async () => {
      axiosMock.post.mockResolvedValueOnce(accept(1));

      await create().record(action, { ...details, changeSet: { before: { a: 1 }, after: { a: 2 } } });

      expect(sentEvents()[0].changeSet).toBeUndefined();
    });

    it('sends the change set of a capturing action', async () => {
      axiosMock.post.mockResolvedValueOnce(accept(1));
      const changeSet = { before: { a: 1 }, after: { a: 2 } };

      await create().record({ ...action, captureChangeSet: true }, { ...details, changeSet });

      expect(sentEvents()[0].changeSet).toEqual(changeSet);
    });

    it('resolves rejected events with the service reason and counts them as dropped', async () => {
      axiosMock.post.mockResolvedValueOnce(
        accept(1, [{ index: 1, code: 'invalid_metadata', reason: 'metadata is invalid' }]),
      );
      const service = create(false, { batchSize: 2 });

      const outcomes = await Promise.all([service.record(action, details), service.record(action, details)]);

      expect(outcomes[0].status).toBe('recorded');
      expect(outcomes[1]).toMatchObject({
        status: 'rejected',
        code: 'invalid_metadata',
        reason: 'metadata is invalid',
      });
      expect(service.droppedEventCount).toBe(1);
    });

    it('requires a tenant for a core service', async () => {
      const service = create(true);

      await expect(service.record(action, details)).resolves.toMatchObject({
        status: 'failed',
        reason: 'invalid_event',
      });
      expect(axiosMock.post).not.toHaveBeenCalled();
      expect(service.droppedEventCount).toBe(1);
    });

    it('fails an event with an invalid occurrence time without sending it', async () => {
      await expect(create().record(action, { ...details, occurredAt: new Date('invalid') })).resolves.toMatchObject({
        status: 'failed',
        reason: 'invalid_event',
      });
      expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('sends core events in separate batches per tenant', async () => {
      axiosMock.post.mockResolvedValue(accept(1));
      const service = create(true, { batchSize: 100 });

      await Promise.all([
        service.record(action, { ...details, tenantId }),
        service.record(action, { ...details, tenantId: otherTenantId }),
      ]);

      expect(axiosMock.post).toHaveBeenCalledTimes(2);
      expect(axiosMock.post.mock.calls.map(([, , config]) => config.params)).toEqual([
        { tenantId: tenantId.toString() },
        { tenantId: otherTenantId.toString() },
      ]);
    });

    it('ignores tenantId for a tenant service', async () => {
      axiosMock.post.mockResolvedValueOnce(accept(1));

      await create().record(action, { ...details, tenantId });

      expect(axiosMock.post.mock.calls[0][2].params).toBeUndefined();
    });
  });

  describe('batching', () => {
    it('sends a full batch of 100 events immediately when batching is enabled', async () => {
      jest.useFakeTimers();
      axiosMock.post.mockResolvedValue(accept(100));
      const service = new AuditServiceImpl(false, logger, directory, tokenProvider, serviceId, { batchSize: 100 });

      const outcomes = Promise.all(Array.from({ length: 101 }, () => service.record(action, details)));
      await jest.advanceTimersByTimeAsync(0);

      expect(axiosMock.post).toHaveBeenCalledTimes(1);
      expect(sentEvents()).toHaveLength(100);

      axiosMock.post.mockResolvedValue(accept(1));
      await jest.advanceTimersByTimeAsync(500);
      expect(axiosMock.post).toHaveBeenCalledTimes(2);
      expect(sentEvents(1)).toHaveLength(1);
      expect((await outcomes).every(({ status }) => status === 'recorded')).toBe(true);
    });

    it('sends a partial batch after 500 ms when batching is enabled', async () => {
      jest.useFakeTimers();
      axiosMock.post.mockResolvedValue(accept(2));
      const service = new AuditServiceImpl(false, logger, directory, tokenProvider, serviceId, { batchSize: 100 });

      const outcomes = Promise.all([service.record(action, details), service.record(action, details)]);
      await jest.advanceTimersByTimeAsync(499);
      expect(axiosMock.post).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1);
      expect(axiosMock.post).toHaveBeenCalledTimes(1);
      expect(sentEvents()).toHaveLength(2);
      await expect(outcomes).resolves.toEqual([
        expect.objectContaining({ status: 'recorded' }),
        expect.objectContaining({ status: 'recorded' }),
      ]);
    });

    it('waits for action registration before sending', async () => {
      let register: () => void;
      const ready = new Promise<void>((resolve) => (register = resolve));
      axiosMock.post.mockResolvedValue(accept(1));
      const service = create(false, { ready });

      const outcome = service.record(action, details);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(axiosMock.post).not.toHaveBeenCalled();

      register();
      await expect(outcome).resolves.toMatchObject({ status: 'recorded' });
    });

    it('sends after a failed registration', async () => {
      axiosMock.post.mockResolvedValue(accept(1));
      const service = create(false, { ready: Promise.reject(new Error('registration failed')) });

      await expect(service.record(action, details)).resolves.toMatchObject({ status: 'recorded' });
    });
  });

  describe('flush', () => {
    it('sends everything buffered and resolves after it is sent', async () => {
      axiosMock.post.mockResolvedValue(accept(2));
      const service = create(false, { batchSize: 100, batchIntervalMs: 60000 });
      const outcomes = [service.record(action, details), service.record(action, details)];

      await service.flush();

      expect(axiosMock.post).toHaveBeenCalledTimes(1);
      await expect(Promise.all(outcomes)).resolves.toEqual([
        expect.objectContaining({ status: 'recorded' }),
        expect.objectContaining({ status: 'recorded' }),
      ]);
    });

    it('waits for batches that are retrying', async () => {
      axiosMock.post.mockRejectedValueOnce(httpError(503)).mockResolvedValueOnce(accept(1));
      const service = create(false, { retryDelaysMs: [30] });
      let settled = false;
      service.record(action, details).then(() => (settled = true));

      await service.flush();

      expect(settled).toBe(true);
      expect(axiosMock.post).toHaveBeenCalledTimes(2);
    });

    it('waits for an unawaited immediate request already in flight', async () => {
      jest.useFakeTimers();
      let confirm: (response: ReturnType<typeof accept>) => void;
      axiosMock.post.mockReturnValueOnce(new Promise((resolve) => (confirm = resolve)));
      const service = create();
      service.record(action, details);
      await jest.advanceTimersByTimeAsync(0);
      const settled = jest.fn();

      const flushing = service.flush();
      flushing.then(settled);
      await jest.advanceTimersByTimeAsync(0);

      expect(settled).not.toHaveBeenCalled();
      confirm(accept(1));
      await flushing;
      expect(settled).toHaveBeenCalledTimes(1);
      expect(axiosMock.post).toHaveBeenCalledTimes(1);
    });

    it('resolves when nothing is buffered', async () => {
      await expect(create().flush()).resolves.toBeUndefined();
    });
  });

  describe('retry and dropped events', () => {
    it.each([[429], [502], [503], [504], [undefined]])('retries a transient failure (%s)', async (status) => {
      axiosMock.post.mockRejectedValueOnce(httpError(status)).mockResolvedValueOnce(accept(1));
      const service = create();

      const outcome = await service.record(action, details);

      expect(outcome.status).toBe('recorded');
      expect(axiosMock.post).toHaveBeenCalledTimes(2);
      expect(sentEvents(1)[0].eventId).toBe(sentEvents(0)[0].eventId);
      expect(service.droppedEventCount).toBe(0);
    });

    it('honours Retry-After up to the configured maximum', async () => {
      jest.useFakeTimers();
      axiosMock.post.mockRejectedValueOnce(httpError(503, { 'retry-after': '2' })).mockResolvedValueOnce(accept(1));
      const service = create(false, { retryDelaysMs: [200], maxRetryAfterMs: 30000 });

      service.record(action, details);
      await jest.advanceTimersByTimeAsync(1999);
      expect(axiosMock.post).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1);
      expect(axiosMock.post).toHaveBeenCalledTimes(2);
    });

    it('surfaces exhausted retries and counts the dropped events', async () => {
      axiosMock.post.mockRejectedValue(httpError(503));
      const service = create();

      const outcomes = await Promise.all([service.record(action, details), service.record(action, details)]);

      expect(axiosMock.post).toHaveBeenCalledTimes(6);
      expect(outcomes).toEqual([
        expect.objectContaining({
          status: 'failed',
          reason: 'retries_exhausted',
          error: expect.stringContaining('503'),
        }),
        expect.objectContaining({ status: 'failed', reason: 'retries_exhausted' }),
      ]);
      expect(service.droppedEventCount).toBe(2);
    });

    it.each([[400], [401], [403], [413], [500]])('does not retry a non-transient failure (%s)', async (status) => {
      axiosMock.post.mockRejectedValue(httpError(status));
      const service = create();

      await expect(service.record(action, details)).resolves.toMatchObject({
        status: 'failed',
        reason: 'request_failed',
      });
      expect(axiosMock.post).toHaveBeenCalledTimes(1);
      expect(service.droppedEventCount).toBe(1);
    });

    it('fails events when the response does not account for them', async () => {
      axiosMock.post.mockResolvedValue({ data: { accepted: 0, duplicates: 0, rejected: [] } });
      const service = create();

      await expect(service.record(action, details)).resolves.toMatchObject({
        status: 'failed',
        reason: 'invalid_response',
      });
      expect(axiosMock.post).toHaveBeenCalledTimes(1);
    });

    it('fails new events while the buffer, including retrying batches, is full', async () => {
      axiosMock.post.mockRejectedValueOnce(httpError(503)).mockResolvedValueOnce(accept(2));
      const service = create(false, { batchSize: 2, maxBufferedEvents: 2, retryDelaysMs: [20] });

      const buffered = [service.record(action, details), service.record(action, details)];
      const overflow = await service.record(action, details);

      expect(overflow).toMatchObject({ status: 'failed', reason: 'buffer_full' });
      expect(service.droppedEventCount).toBe(1);
      await expect(Promise.all(buffered)).resolves.toEqual([
        expect.objectContaining({ status: 'recorded' }),
        expect.objectContaining({ status: 'recorded' }),
      ]);
      await expect(service.record(action, details)).resolves.toMatchObject({ status: 'failed' });
    });

    it('fails new events that would exceed the byte limit', async () => {
      axiosMock.post.mockResolvedValue(accept(1));
      const service = create(false, { maxBufferedBytes: 1024 });

      const small = service.record(action, details);
      const large = await service.record(action, { ...details, metadata: { text: 'x'.repeat(1024) } });

      expect(large).toMatchObject({ status: 'failed', reason: 'buffer_full' });
      await expect(small).resolves.toMatchObject({ status: 'recorded' });
      await expect(service.record(action, details)).resolves.toMatchObject({ status: 'recorded' });
    });

    it('bounds immediate requests in flight and releases capacity after confirmation', async () => {
      jest.useFakeTimers();
      let confirm: (response: ReturnType<typeof accept>) => void;
      axiosMock.post.mockReturnValueOnce(new Promise((resolve) => (confirm = resolve))).mockResolvedValue(accept(1));
      const service = create(false, { maxBufferedEvents: 1 });
      const first = service.record(action, details);
      await jest.advanceTimersByTimeAsync(0);

      await expect(service.record(action, details)).resolves.toMatchObject({
        status: 'failed',
        reason: 'buffer_full',
      });

      expect(axiosMock.post).toHaveBeenCalledTimes(1);
      confirm(accept(1));
      await expect(first).resolves.toMatchObject({ status: 'recorded' });
      await expect(service.record(action, details)).resolves.toMatchObject({ status: 'recorded' });
      expect(axiosMock.post).toHaveBeenCalledTimes(2);
    });

    it('fails an unserializable event without affecting its batch', async () => {
      axiosMock.post.mockResolvedValue(accept(1));
      const metadata: Record<string, unknown> = {};
      metadata.self = metadata;
      const service = create();

      const outcomes = await Promise.all([
        service.record(action, details),
        service.record(action, { ...details, metadata }),
      ]);

      expect(outcomes.map(({ status }) => status)).toEqual(['recorded', 'failed']);
      expect(outcomes[1]).toMatchObject({ reason: 'invalid_event' });
      expect(sentEvents()).toHaveLength(1);
    });

    it('exports the dropped-event metric by reason', async () => {
      const exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
      const reader = new PeriodicExportingMetricReader({ exporter, exportIntervalMillis: 60000 });
      const meterProvider = new MeterProvider({ readers: [reader] });
      axiosMock.post.mockRejectedValue(httpError(503));
      const service = create(false, { meterProvider });

      await service.record(action, details);
      await reader.forceFlush();

      const metric = exporter
        .getMetrics()
        .flatMap(({ scopeMetrics }) => scopeMetrics.flatMap(({ metrics }) => metrics))
        .find(({ descriptor }) => descriptor.name === 'audit.client.dropped_events');
      expect(metric?.dataPoints).toEqual([
        expect.objectContaining({ attributes: { reason: 'retries_exhausted' }, value: 1 }),
      ]);
      await meterProvider.shutdown();
    });
  });

  describe('query', () => {
    const page = { results: [], page: { size: 0 } };

    it('reads the service namespace with top/after pagination and returns the results envelope', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: page });

      const result = await create().query(
        { action: 'case.update', occurredFrom: new Date('2026-10-01T00:00:00Z'), resourceId: undefined },
        { top: 5, after: 'cursor' },
      );

      expect(result).toBe(page);
      expect(axiosMock.get).toHaveBeenCalledWith('https://audit.example.test/audit/v1/case-service/events', {
        headers: { Authorization: 'Bearer service-token' },
        params: { action: 'case.update', occurredFrom: '2026-10-01T00:00:00.000Z', top: 5, after: 'cursor' },
      });
    });

    it('queries as a supplied user token, in another namespace and tenant', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: page });

      await create(true).query({}, { namespace: 'payment-service', tenantId, token: 'user-token' });

      expect(tokenProvider.getAccessToken).not.toHaveBeenCalled();
      expect(axiosMock.get).toHaveBeenCalledWith('https://audit.example.test/audit/v1/payment-service/events', {
        headers: { Authorization: 'Bearer user-token' },
        params: { tenantId: tenantId.toString() },
      });
    });

    it('rejects an invalid namespace', async () => {
      await expect(create().query({}, { namespace: '../events' })).rejects.toThrow('Invalid audit namespace');
      expect(axiosMock.get).not.toHaveBeenCalled();
    });

    it('propagates read failures', async () => {
      axiosMock.get.mockRejectedValueOnce(httpError(403));

      await expect(create().query()).rejects.toThrow('request failed');
    });
  });
});
