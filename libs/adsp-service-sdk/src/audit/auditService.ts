import axios from 'axios';
import { metrics } from '@opentelemetry/api';
import type { Counter, MeterProvider } from '@opentelemetry/api';
import { randomUUID } from 'crypto';
import type { Logger } from 'winston';
import type { TokenProvider } from '../access';
import type { Results } from '../common';
import type { ServiceDirectory } from '../directory';
import { AdspId, adspId } from '../utils';
import type { AuditAction } from './definitions';
import type {
  AuditChangeSet,
  AuditDropReason,
  AuditEventCriteria,
  AuditEventRecord,
  AuditQueryOptions,
  AuditRecordDetails,
  AuditRecordOutcome,
  AuditService,
} from './types';

export interface AuditClientOptions {
  /** Events per request; a batch is sent as soon as it is full. */
  batchSize?: number;
  /** Longest an event waits in a partial batch. */
  batchIntervalMs?: number;
  /** Events held across queued, in-flight and retrying batches; further records fail with `buffer_full`. */
  maxBufferedEvents?: number;
  /** Serialized bytes held across queued, in-flight and retrying batches; further records fail with `buffer_full`. */
  maxBufferedBytes?: number;
  /** Delay before each retry; its length is the number of retries. */
  retryDelaysMs?: number[];
  /** Upper bound on a delay requested by the service's `Retry-After` header. */
  maxRetryAfterMs?: number;
  /** Timeout of each write request. */
  requestTimeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<AuditClientOptions> = {
  batchSize: 100,
  batchIntervalMs: 500,
  // Bounds memory if the audit service is unavailable: events can be up to ~33 KB (16 KiB metadata and change set).
  maxBufferedEvents: 1000,
  maxBufferedBytes: 8 * 1024 * 1024,
  retryDelaysMs: [200, 1000, 3000, 5000],
  maxRetryAfterMs: 30000,
  requestTimeoutMs: 10000,
};

// Rate limiting, storage unavailability and gateway errors; network errors and timeouts have no response.
const TRANSIENT_STATUSES = new Set([429, 502, 503, 504]);
const NAMESPACE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface AuditEventPayload {
  eventId: string;
  occurredAt: string;
  action: string;
  actionVersion: number;
  status: string;
  actor: AuditRecordDetails['actor'];
  resource?: AuditRecordDetails['resource'];
  scopeIds?: string[];
  correlationId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  changeSet?: AuditChangeSet;
}

interface WriteEventsResponse {
  accepted: number;
  duplicates: number;
  rejected: { index: number; eventId?: string; code: string; reason: string }[];
}

interface PendingEvent {
  event: AuditEventPayload;
  /** Serialized size in bytes. */
  size: number;
  settle: (outcome: AuditRecordOutcome) => void;
}

interface TenantQueue {
  tenantId?: AdspId;
  events: PendingEvent[];
  timer?: NodeJS.Timeout;
}

type FailureReason = Exclude<AuditDropReason, 'rejected'>;

class DeliveryError extends Error {
  constructor(
    readonly reason: FailureReason,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, DeliveryError.prototype);
  }
}

function isTransient(err: unknown): boolean {
  if (!axios.isAxiosError(err)) {
    return false;
  }
  return !err.response || TRANSIENT_STATUSES.has(err.response.status);
}

function describeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.errorMessage;
    return err.response
      ? `Request failed with status ${err.response.status}${message ? `: ${message}` : ''}.`
      : `Request failed: ${err.code || err.message}.`;
  }
  return err instanceof Error ? err.message : String(err);
}

function getRetryAfterMs(err: unknown): number | undefined {
  const value = axios.isAxiosError(err) ? err.response?.headers?.['retry-after'] : undefined;
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }
  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(seconds, 0) * 1000;
  }
  const date = Date.parse(String(value));
  return Number.isFinite(date) ? Math.max(date - Date.now(), 0) : undefined;
}

function isValidResponse(data: unknown, size: number): data is WriteEventsResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const { accepted, duplicates, rejected } = data as WriteEventsResponse;
  if (!Number.isInteger(accepted) || !Number.isInteger(duplicates) || !Array.isArray(rejected)) {
    return false;
  }
  const indexes = new Set(rejected.map((item) => item?.index));
  return (
    accepted + duplicates + rejected.length === size &&
    indexes.size === rejected.length &&
    [...indexes].every((index) => Number.isInteger(index) && index >= 0 && index < size)
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class AuditServiceImpl implements AuditService {
  private readonly LOG_CONTEXT = { context: 'AuditService' };

  private readonly namespace: string;
  private readonly options: Required<AuditClientOptions>;
  private readonly ready: Promise<void>;
  private readonly droppedCounter: Counter;
  private readonly queues = new Map<string, TenantQueue>();
  private readonly sending = new Set<Promise<void>>();
  private buffered = 0;
  private bufferedBytes = 0;
  private dropped = 0;

  constructor(
    private readonly isCore: boolean,
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider,
    serviceId: AdspId,
    {
      ready,
      meterProvider,
      ...options
    }: AuditClientOptions & { ready?: Promise<unknown>; meterProvider?: MeterProvider } = {},
  ) {
    this.namespace = serviceId.service;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    // Sending waits for action registration to settle, so the first events are not rejected as unknown actions.
    this.ready = ready
      ? ready.then(
          () => undefined,
          () => undefined,
        )
      : Promise.resolve();
    this.droppedCounter = (meterProvider || metrics.getMeterProvider())
      .getMeter('adsp-service-sdk')
      .createCounter('audit.client.dropped_events', {
        description: 'Audit events the ADSP SDK client did not store: rejected by the service or not delivered.',
      });
  }

  get droppedEventCount(): number {
    return this.dropped;
  }

  record(action: AuditAction, details: AuditRecordDetails): Promise<AuditRecordOutcome> {
    const eventId = details?.eventId || randomUUID();
    if (this.isCore && !details?.tenantId) {
      return Promise.resolve(
        this.fail(eventId, 'invalid_event', 'tenantId is required to record an audit event from a core service.'),
      );
    }

    let event: AuditEventPayload;
    let size: number;
    try {
      event = this.toPayload(action, details, eventId);
      // Serializing here also fails unserializable details (e.g. circular metadata) for this event only.
      size = Buffer.byteLength(JSON.stringify(event));
    } catch (err) {
      return Promise.resolve(this.fail(eventId, 'invalid_event', describeError(err)));
    }

    const { maxBufferedEvents, maxBufferedBytes } = this.options;
    if (this.buffered >= maxBufferedEvents || this.bufferedBytes + size > maxBufferedBytes) {
      return Promise.resolve(
        this.fail(
          eventId,
          'buffer_full',
          `Audit buffer is full (${this.buffered} of ${maxBufferedEvents} events, ` +
            `${this.bufferedBytes} + ${size} of ${maxBufferedBytes} bytes).`,
        ),
      );
    }

    return new Promise((settle) => this.enqueue(this.isCore ? details.tenantId : undefined, { event, size, settle }));
  }

  async query(
    criteria: AuditEventCriteria = {},
    { top, after, namespace = this.namespace, tenantId, token }: AuditQueryOptions = {},
  ): Promise<Results<AuditEventRecord>> {
    if (!NAMESPACE_PATTERN.test(namespace)) {
      throw new Error(`Invalid audit namespace: ${namespace}`);
    }

    const url = await this.directory.getResourceUrl(adspId`urn:ads:platform:audit-service:v1:/${namespace}/events`);
    const params = Object.fromEntries(
      Object.entries({ ...criteria, top, after, tenantId: tenantId?.toString() })
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]),
    );

    const { data } = await axios.get<Results<AuditEventRecord>>(url.href, {
      headers: { Authorization: `Bearer ${token || (await this.tokenProvider.getAccessToken())}` },
      params,
    });
    return data;
  }

  async flush(): Promise<void> {
    while (this.queues.size > 0 || this.sending.size > 0) {
      for (const key of [...this.queues.keys()]) {
        this.dispatch(key);
      }
      await Promise.allSettled([...this.sending]);
    }
  }

  private toPayload(action: AuditAction, details: AuditRecordDetails, eventId: string): AuditEventPayload {
    const { status, actor, occurredAt, resource, scopeIds, correlationId, sessionId, metadata, changeSet } = details;
    return {
      eventId,
      occurredAt: (occurredAt || new Date()).toISOString(),
      action: action.name,
      actionVersion: action.version,
      status: status || 'success',
      actor,
      resource,
      scopeIds,
      correlationId,
      sessionId,
      metadata,
      // Change sets of non-capturing actions never leave the process.
      changeSet: action.captureChangeSet ? changeSet : undefined,
    };
  }

  private enqueue(tenantId: AdspId | undefined, pending: PendingEvent) {
    const key = tenantId?.toString() || '';
    let queue = this.queues.get(key);
    if (!queue) {
      queue = { tenantId, events: [] };
      this.queues.set(key, queue);
    }

    queue.events.push(pending);
    this.buffered++;
    this.bufferedBytes += pending.size;

    if (queue.events.length >= this.options.batchSize) {
      this.dispatch(key);
    } else if (!queue.timer) {
      queue.timer = setTimeout(() => this.dispatch(key), this.options.batchIntervalMs);
    }
  }

  private dispatch(key: string) {
    const queue = this.queues.get(key);
    if (!queue) {
      return;
    }

    clearTimeout(queue.timer);
    this.queues.delete(key);

    const sending = this.sendBatch(queue.tenantId, queue.events).finally(() => this.sending.delete(sending));
    this.sending.add(sending);
  }

  private async sendBatch(tenantId: AdspId | undefined, batch: PendingEvent[]): Promise<void> {
    let outcomes: AuditRecordOutcome[];
    try {
      await this.ready;
      const response = await this.post(
        tenantId,
        batch.map(({ event }) => event),
      );
      outcomes = this.toOutcomes(batch, response);
    } catch (err) {
      const reason: FailureReason = err instanceof DeliveryError ? err.reason : 'request_failed';
      const error = describeError(err);
      this.logger.error(`Failed to send ${batch.length} audit event(s) for ${this.namespace} (${reason}). ${error}`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
      outcomes = batch.map(({ event }) => ({ status: 'failed', eventId: event.eventId, reason, error }));
    } finally {
      this.buffered -= batch.length;
      this.bufferedBytes -= batch.reduce((total, { size }) => total + size, 0);
    }

    outcomes.forEach((outcome, index) => {
      if (outcome.status !== 'recorded') {
        this.countDropped(outcome.status === 'rejected' ? 'rejected' : outcome.reason);
      }
      batch[index].settle(outcome);
    });
  }

  private async post(tenantId: AdspId | undefined, events: AuditEventPayload[]): Promise<WriteEventsResponse> {
    const { retryDelaysMs, requestTimeoutMs, maxRetryAfterMs } = this.options;
    for (let attempt = 0; ; attempt++) {
      try {
        const url = await this.directory.getResourceUrl(
          adspId`urn:ads:platform:audit-service:v1:/${this.namespace}/events`,
        );
        const token = await this.tokenProvider.getAccessToken();
        const { data } = await axios.post<WriteEventsResponse>(
          url.href,
          { events },
          {
            headers: { Authorization: `Bearer ${token}` },
            params: tenantId ? { tenantId: tenantId.toString() } : undefined,
            timeout: requestTimeoutMs,
          },
        );
        if (!isValidResponse(data, events.length)) {
          throw new DeliveryError('invalid_response', 'Audit service response does not account for every event.');
        }
        return data;
      } catch (err) {
        if (err instanceof DeliveryError) {
          throw err;
        }
        const transient = isTransient(err);
        if (!transient || attempt >= retryDelaysMs.length) {
          throw new DeliveryError(transient ? 'retries_exhausted' : 'request_failed', describeError(err));
        }

        const retryAfter = getRetryAfterMs(err);
        const delay = Math.max(retryDelaysMs[attempt], Math.min(retryAfter ?? 0, maxRetryAfterMs));
        this.logger.debug(`Audit write attempt ${attempt + 1} failed; retrying in ${delay} ms. ${describeError(err)}`, {
          ...this.LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
        await sleep(delay);
      }
    }
  }

  private toOutcomes(batch: PendingEvent[], { rejected }: WriteEventsResponse): AuditRecordOutcome[] {
    const rejections = new Map(rejected.map((item) => [item.index, item]));
    if (rejections.size) {
      this.logger.warn(
        `Audit service rejected ${rejections.size} of ${batch.length} event(s) for ${this.namespace}: ` +
          [...new Set(rejected.map(({ code }) => code))].join(', '),
        this.LOG_CONTEXT,
      );
    }

    return batch.map(({ event: { eventId } }, index): AuditRecordOutcome => {
      const rejection = rejections.get(index);
      return rejection
        ? { status: 'rejected', eventId, code: rejection.code, reason: rejection.reason }
        : { status: 'recorded', eventId };
    });
  }

  private fail(eventId: string, reason: FailureReason, error: string): AuditRecordOutcome {
    this.logger.warn(`Audit event for ${this.namespace} was not recorded (${reason}). ${error}`, this.LOG_CONTEXT);
    this.countDropped(reason);
    return { status: 'failed', eventId, reason, error };
  }

  private countDropped(reason: AuditDropReason) {
    this.dropped++;
    this.droppedCounter.add(1, { reason });
  }
}
