import { handleWhen, IterableBackoff, retry } from 'cockatiel';
import type { Logger } from 'winston';
import type { EnrichedEvent, EventOutcome } from '../types';
import { EVENT_OUTCOME_STATUS, EVENT_OUTCOME_CODE, FAILED_EVENT_STATUS } from '../types';
import { AuditEventStore, AuditStorageUnavailableError, AuditStoreError, FailedAuditEvent } from './store';

export const WRITE_TIMEOUT_MS = 10000;
export const PARK_TIMEOUT_MS = 5000;
const RETRY_DELAYS_MS = [200, 1000, 3000];
const PARKED_REASON = 'The event was stored for administrative replay after an audit storage failure.';

interface WriteSignals {
  write: AbortSignal;
  stop: AbortSignal;
}

interface FailedWrite {
  event: EnrichedEvent;
  error: unknown;
}

function cancellationScope(parent: AbortSignal, timeoutMs: number) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  parent.addEventListener('abort', abort, { once: true });
  if (parent.aborted) abort();
  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      parent.removeEventListener('abort', abort);
    },
  };
}

export class DurableEventWriter {
  private activeOperations = 0;
  private cancelledOperation = false;
  private available = true;
  private readonly retryPolicy = retry(
    handleWhen((err) => err instanceof AuditStoreError && err.kind === 'transient'),
    {
      maxAttempts: RETRY_DELAYS_MS.length,
      backoff: new IterableBackoff(RETRY_DELAYS_MS),
    },
  );

  constructor(
    private readonly store: AuditEventStore,
    private readonly logger: Logger,
  ) {}

  get isAvailable(): boolean {
    return this.available;
  }

  get isBusy(): boolean {
    return this.activeOperations > 0;
  }

  get hasUnfinishedCancellation(): boolean {
    return this.cancelledOperation && this.isBusy;
  }

  async write(events: readonly EnrichedEvent[], signals: WriteSignals): Promise<Map<string, EventOutcome>> {
    const scope = cancellationScope(signals.write, WRITE_TIMEOUT_MS);
    const attempts = new Map<string, number>();
    const outcomes = new Map<string, EventOutcome>();
    let failed: FailedWrite[];
    try {
      failed = await this.writePrimary(events, attempts, outcomes, scope.signal);
    } catch (error) {
      if (error instanceof AuditStorageUnavailableError) {
        this.recordLoss(events.length - outcomes.size);
        throw error;
      }
      failed = events.filter(({ id }) => !outcomes.has(id)).map((event) => ({ event, error }));
    } finally {
      scope.dispose();
    }
    if (failed.length) {
      const parked = await this.park(failed, attempts, signals.stop);
      for (const [id, outcome] of parked) outcomes.set(id, outcome);
    }
    return outcomes;
  }

  async park(
    failed: readonly FailedWrite[],
    attempts: ReadonlyMap<string, number>,
    stop: AbortSignal,
  ): Promise<Map<string, EventOutcome>> {
    const scope = cancellationScope(stop, PARK_TIMEOUT_MS);
    const records: FailedAuditEvent[] = failed.map(({ event, error }) => ({
      id: event.id,
      tenant_id: event.tenant_id,
      namespace: event.namespace,
      event_id: event.event_id,
      event: event.originalEvent,
      error: error instanceof Error ? error.message : 'Unknown audit storage failure.',
      attempt_count: attempts.get(event.id) || 0,
      failed_at: new Date(),
      status: FAILED_EVENT_STATUS.OPEN,
    }));
    try {
      await this.executeStore(() => this.store.park(records, { signal: scope.signal }), scope.signal);
      return new Map(
        records.map(({ id }) => [
          id,
          { status: EVENT_OUTCOME_STATUS.REJECTED, code: EVENT_OUTCOME_CODE.STORAGE_FAILED, reason: PARKED_REASON },
        ]),
      );
    } catch {
      this.recordLoss(records.length);
      throw new AuditStorageUnavailableError('Audit events could not be durably stored. Retry the request.');
    } finally {
      scope.dispose();
    }
  }

  private async writePrimary(
    events: readonly EnrichedEvent[],
    attempts: Map<string, number>,
    outcomes: Map<string, EventOutcome>,
    signal: AbortSignal,
  ): Promise<FailedWrite[]> {
    try {
      await this.insert(events, attempts, outcomes, signal);
      return [];
    } catch (error) {
      if (!(error instanceof AuditStoreError) || error.kind !== 'constraint') throw error;
    }
    const failed: FailedWrite[] = [];
    for (const event of events) {
      try {
        await this.insert([event], attempts, outcomes, signal);
      } catch (error) {
        if (error instanceof AuditStorageUnavailableError) throw error;
        failed.push({ event, error });
      }
    }
    return failed;
  }

  private async insert(
    events: readonly EnrichedEvent[],
    attempts: Map<string, number>,
    outcomes: Map<string, EventOutcome>,
    signal: AbortSignal,
  ): Promise<void> {
    const inserted = await this.retryPolicy.execute(async () => {
      if (signal.aborted) throw new Error('Audit write deadline exceeded.');
      for (const { id } of events) attempts.set(id, (attempts.get(id) || 0) + 1);
      return this.executeStore(() => this.store.insert(events, { signal }), signal);
    }, signal);
    if (!Array.isArray(inserted)) {
      this.available = false;
      throw new AuditStorageUnavailableError('Audit storage returned invalid inserted identifiers.');
    }
    const insertedIds = new Set(inserted);
    const submittedIds = new Set(events.map(({ id }) => id));
    if (insertedIds.size !== inserted.length || inserted.some((id) => !submittedIds.has(id))) {
      this.available = false;
      throw new AuditStorageUnavailableError('Audit storage returned invalid inserted identifiers.');
    }
    for (const { id } of events)
      outcomes.set(id, {
        status: insertedIds.has(id) ? EVENT_OUTCOME_STATUS.ACCEPTED : EVENT_OUTCOME_STATUS.DUPLICATE,
      });
  }

  private async executeStore<T>(operation: () => Promise<T>, signal: AbortSignal): Promise<T> {
    if (this.isBusy) throw new AuditStorageUnavailableError('A previous audit storage operation has not stopped.');
    if (signal.aborted) throw new Error('Audit write deadline exceeded.');
    this.activeOperations++;
    this.cancelledOperation = false;
    let abort: () => void;
    const cancelled = new Promise<never>((_resolve, reject) => {
      abort = () => reject(new Error('Audit write deadline exceeded.'));
      signal.addEventListener('abort', abort, { once: true });
    });
    // Observe late settlement too; a non-cooperative adapter must not accumulate abandoned writes.
    const execution = Promise.resolve()
      .then(() => {
        if (signal.aborted) throw new Error('Audit write deadline exceeded.');
        return operation();
      })
      .finally(() => this.activeOperations--);
    try {
      const result = await Promise.race([execution, cancelled]);
      this.available = true;
      return result;
    } catch (error) {
      this.cancelledOperation = signal.aborted && this.isBusy;
      this.available = error instanceof AuditStoreError && error.kind === 'constraint' && !signal.aborted;
      this.logger.warn('Audit storage operation failed.', {
        context: 'AuditWrite',
        failureKind: error instanceof AuditStoreError ? error.kind : 'unavailable',
      });
      throw error;
    } finally {
      signal.removeEventListener('abort', abort);
    }
  }

  private recordLoss(count: number): void {
    this.logger.log('critical', 'Audit events could not be acknowledged durably.', {
      context: 'AuditWrite',
      severity: 'critical',
      eventCount: count,
    });
  }
}
