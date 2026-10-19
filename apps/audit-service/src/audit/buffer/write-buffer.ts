import { metrics, Meter, Counter, UpDownCounter } from '@opentelemetry/api';
import type { Logger } from 'winston';
import type { EnrichedEvent, EventOutcome, EventSubmitter } from '../types';
import { DurableEventWriter, PARK_TIMEOUT_MS } from './durable-writer';
import { AuditEventStore, AuditStorageUnavailableError } from './store';

export const WRITE_BATCH_SIZE = 200;
export const WRITE_BATCH_WINDOW_MS = 200;
export const MAX_BUFFERED_EVENTS = 5000;
export const MAX_BUFFERED_BYTES = 32 * 1024 * 1024;
export const SHUTDOWN_TIMEOUT_MS = 25000;
const TERMINATION_GRACE_MS = 30000;
const BUFFER_STATE = {
  ACCEPTING: 'accepting',
  DRAINING: 'draining',
  CLOSED: 'closed',
} as const;

type BufferState = (typeof BUFFER_STATE)[keyof typeof BUFFER_STATE];

export interface WriteBufferOptions {
  maxEvents?: number;
  maxBytes?: number;
  shutdownTimeoutMs?: number;
}

interface Submission {
  events: readonly EnrichedEvent[];
  bytes: number;
  remaining: number;
  outcomes: Map<string, EventOutcome>;
  error?: Error;
  resolve: (outcomes: Map<string, EventOutcome>) => void;
  reject: (error: Error) => void;
}

interface QueuedEvent {
  event: EnrichedEvent;
  submission: Submission;
  queuedAt: number;
}

export class AuditWriteBuffer implements EventSubmitter {
  private readonly writer: DurableEventWriter;
  private readonly options: Required<WriteBufferOptions>;
  private readonly depthMetric: UpDownCounter;
  private readonly bytesMetric: UpDownCounter;
  private readonly failuresMetric: Counter;
  private readonly pending = new Set<Submission>();
  private readonly pendingIds = new Set<string>();
  private queue: QueuedEvent[] = [];
  private inFlight: QueuedEvent[] = [];
  private reservedEvents = 0;
  private reservedBytes = 0;
  private running = false;
  private state: BufferState = BUFFER_STATE.ACCEPTING;
  private timer?: ReturnType<typeof setTimeout>;
  private readonly writeController = new AbortController();
  private readonly stopController = new AbortController();
  private shutdown?: Promise<void>;
  private finishShutdown?: () => void;
  private shutdownError?: Error;

  constructor(
    store: AuditEventStore,
    private readonly logger: Logger,
    options: WriteBufferOptions = {},
    meter: Meter = metrics.getMeter('audit-service'),
  ) {
    this.options = {
      maxEvents: options.maxEvents ?? MAX_BUFFERED_EVENTS,
      maxBytes: options.maxBytes ?? MAX_BUFFERED_BYTES,
      shutdownTimeoutMs: options.shutdownTimeoutMs ?? SHUTDOWN_TIMEOUT_MS,
    };
    this.validateOptions();
    this.writer = new DurableEventWriter(store, logger);
    this.depthMetric = meter.createUpDownCounter('audit_buffer_depth', { unit: '{event}' });
    this.bytesMetric = meter.createUpDownCounter('audit_buffer_bytes', { unit: 'By' });
    this.failuresMetric = meter.createCounter('audit_write_failures_total', {
      description: 'Events whose batch outcome could not be durably confirmed.',
      unit: '{event}',
    });
  }

  get depth(): number {
    return this.reservedEvents;
  }

  get bufferedBytes(): number {
    return this.reservedBytes;
  }

  get isReady(): boolean {
    return this.state === BUFFER_STATE.ACCEPTING && this.writer.isAvailable && !this.writer.hasUnfinishedCancellation;
  }

  async submit(events: EnrichedEvent[]): Promise<Map<string, EventOutcome>> {
    if (this.state !== BUFFER_STATE.ACCEPTING || this.writer.hasUnfinishedCancellation) {
      this.refuse('Audit storage is draining or has an unfinished cancelled write.');
    }
    if (this.depth + events.length > this.options.maxEvents) this.refuse('Audit buffer is at capacity.');
    if (!events.length) return new Map();
    const bytes = this.measureSubmission(events);
    return new Promise((resolve, reject) => {
      const submission: Submission = {
        events: [...events],
        bytes,
        remaining: events.length,
        outcomes: new Map(),
        resolve,
        reject,
      };
      this.pending.add(submission);
      this.reserve(submission, 1);
      const queuedAt = Date.now();
      for (const event of events) {
        this.pendingIds.add(event.id);
        this.queue.push({ event, submission, queuedAt });
      }
      this.schedule();
    });
  }

  close(): Promise<void> {
    if (this.shutdown) return this.shutdown;
    this.state = BUFFER_STATE.DRAINING;
    if (this.writer.hasUnfinishedCancellation) {
      this.shutdownError = new AuditStorageUnavailableError('A cancelled audit storage operation has not stopped.');
    }
    this.shutdown = new Promise((resolve, reject) => {
      const parkTimer = setTimeout(() => {
        this.logger.log('critical', 'Audit shutdown is switching remaining writes to failed-event storage.', {
          context: 'AuditWrite',
          severity: 'critical',
          eventCount: this.queue.length + this.inFlight.length,
        });
        this.writeController.abort();
      }, this.options.shutdownTimeoutMs - PARK_TIMEOUT_MS);
      const stopTimer = setTimeout(() => this.expireShutdown(), this.options.shutdownTimeoutMs);
      this.finishShutdown = () => {
        clearTimeout(parkTimer);
        clearTimeout(stopTimer);
        this.state = BUFFER_STATE.CLOSED;
        if (this.shutdownError) reject(this.shutdownError);
        else resolve();
      };
      this.schedule();
      this.finishIfDrained();
    });
    return this.shutdown;
  }

  private validateOptions(): void {
    const { maxEvents, maxBytes, shutdownTimeoutMs } = this.options;
    if (
      !Number.isSafeInteger(maxEvents) ||
      maxEvents < 1 ||
      maxEvents > MAX_BUFFERED_EVENTS ||
      !Number.isSafeInteger(maxBytes) ||
      maxBytes < 1 ||
      !Number.isSafeInteger(shutdownTimeoutMs) ||
      shutdownTimeoutMs <= PARK_TIMEOUT_MS ||
      shutdownTimeoutMs >= TERMINATION_GRACE_MS
    ) {
      throw new Error(
        'Invalid audit buffer limits; shutdown must reserve parking time within the 30-second grace period.',
      );
    }
  }

  private measureSubmission(events: EnrichedEvent[]): number {
    const ids = new Set<string>();
    let bytes = 0;
    try {
      for (const event of events) {
        if (!event.id || ids.has(event.id) || this.pendingIds.has(event.id)) {
          this.refuse('Audit submission must have unique service-generated identifiers.');
        }
        ids.add(event.id);
        bytes += Buffer.byteLength(JSON.stringify(event), 'utf8');
        if (this.bufferedBytes + bytes > this.options.maxBytes) this.refuse('Audit buffer byte capacity is exhausted.');
      }
    } catch (error) {
      if (error instanceof AuditStorageUnavailableError) throw error;
      this.refuse('Audit submission could not be measured safely.');
    }
    return bytes;
  }

  private refuse(message: string): never {
    this.logger.warn(message, { context: 'AuditWrite' });
    throw new AuditStorageUnavailableError(message);
  }

  private reserve(submission: Submission, direction: 1 | -1): void {
    this.reservedEvents += direction * submission.events.length;
    this.reservedBytes += direction * submission.bytes;
    this.depthMetric.add(direction * submission.events.length);
    this.bytesMetric.add(direction * submission.bytes);
  }

  private schedule(): void {
    clearTimeout(this.timer);
    if (this.running || this.state === BUFFER_STATE.CLOSED || !this.queue.length) return;
    const delay = this.queue[0].queuedAt + WRITE_BATCH_WINDOW_MS - Date.now();
    if (this.state === BUFFER_STATE.DRAINING || this.queue.length >= WRITE_BATCH_SIZE || delay <= 0) {
      void this.flushBatch();
    } else {
      this.timer = setTimeout(() => this.schedule(), delay);
    }
  }

  private async flushBatch(): Promise<void> {
    this.running = true;
    const batch = this.queue.splice(0, WRITE_BATCH_SIZE);
    this.inFlight = batch;
    const events = batch.map(({ event }) => event);
    try {
      const outcomes = this.writeController.signal.aborted
        ? await this.writer.park(
            events.map((event) => ({ event, error: new Error('Audit shutdown flush deadline exceeded.') })),
            new Map(),
            this.stopController.signal,
          )
        : await this.writer.write(events, { write: this.writeController.signal, stop: this.stopController.signal });
      for (const entry of batch) this.complete(entry, outcomes.get(entry.event.id));
    } catch {
      const unavailable = new AuditStorageUnavailableError(
        'Audit events could not be durably stored. Retry the request.',
      );
      this.logger.error('Audit batch could not be completed.', { context: 'AuditWrite', eventCount: events.length });
      for (const entry of batch) this.complete(entry, undefined, unavailable);
    } finally {
      this.inFlight = [];
      this.running = false;
      this.schedule();
      this.finishIfDrained();
    }
  }

  private complete(entry: QueuedEvent, outcome?: EventOutcome, error?: Error): void {
    const { submission, event } = entry;
    if (!this.pending.has(submission)) return;
    if (outcome) submission.outcomes.set(event.id, outcome);
    else {
      submission.error = error || new AuditStorageUnavailableError('Audit storage returned an incomplete result.');
      if (this.state === BUFFER_STATE.DRAINING) this.shutdownError = submission.error;
      this.failuresMetric.add(1);
    }
    submission.remaining--;
    if (submission.remaining) return;
    this.release(submission);
    if (submission.error) submission.reject(submission.error);
    else submission.resolve(submission.outcomes);
  }

  private release(submission: Submission): void {
    this.pending.delete(submission);
    for (const { id } of submission.events) this.pendingIds.delete(id);
    this.reserve(submission, -1);
  }

  private expireShutdown(): void {
    this.shutdownError = new AuditStorageUnavailableError('Audit shutdown expired with unacknowledged events.');
    this.logger.log('critical', 'Audit shutdown deadline exceeded; callers must retry unacknowledged events.', {
      context: 'AuditWrite',
      severity: 'critical',
      eventCount: this.queue.length + this.inFlight.length,
    });
    this.stopController.abort();
    this.writeController.abort();
    this.queue = [];
    for (const submission of this.pending) {
      this.failuresMetric.add(submission.remaining);
      this.release(submission);
      submission.reject(this.shutdownError);
    }
    this.finishShutdown();
  }

  private finishIfDrained(): void {
    if (this.state === BUFFER_STATE.DRAINING && !this.running && !this.queue.length) this.finishShutdown();
  }
}
