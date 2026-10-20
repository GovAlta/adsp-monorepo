import { User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, Results } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import { CONFLICT, SERVICE_UNAVAILABLE } from 'http-status-codes';
import { AuditMetrics } from '../metrics';
import { FailedAuditEvent, FailedEventRepository, ReplayAuditRecord } from '../types';
import { decodeKeysetCursor, encodeKeysetCursor } from '../utils/keyset-cursor';
import { ReplayEventPreparer } from './replay-events';
import { REPLAY_ACTION } from '../actions';

export class FailedEventService {
  constructor(
    private readonly repository: FailedEventRepository | undefined,
    private readonly writtenBy: string,
    private readonly metrics: AuditMetrics,
    private readonly preparer: Pick<ReplayEventPreparer, 'prepare' | 'prepareAudit'>,
  ) {}

  private requireRepository(): FailedEventRepository {
    if (!this.repository) {
      throw new InvalidOperationError('Failed-event storage and transactional self-auditing are not configured.', {
        statusCode: SERVICE_UNAVAILABLE,
      });
    }
    return this.repository;
  }

  async list(tenantId: string, top: number, after?: string): Promise<Results<FailedAuditEvent>> {
    const cursor = after ? decodeKeysetCursor(after) : null;
    if (after && !cursor) throw new InvalidOperationError('after is not a valid cursor.');
    const results = await this.requireRepository().list(
      tenantId,
      top,
      cursor ? { failedAt: cursor.timestamp, id: cursor.id } : undefined,
    );
    if (results.length > top || results.some((event) => event.tenant_id !== tenantId)) {
      throw new InvalidOperationError('Failed-event storage returned an invalid tenant page.', {
        statusCode: SERVICE_UNAVAILABLE,
      });
    }
    const last = results[results.length - 1];
    return {
      results,
      page: {
        after,
        size: results.length,
        next: results.length === top ? encodeKeysetCursor(last.failed_at, last.id) : undefined,
      },
    };
  }

  async replay(tenantId: string, id: string, administrator: User): Promise<FailedAuditEvent> {
    const repository = this.requireRepository();
    let saving = false;
    try {
      return await repository.withReplayTransaction(tenantId, async (transaction) => {
        const failed = await transaction.getForUpdate(id);
        if (!failed || failed.tenant_id !== tenantId) throw new NotFoundError('failed audit event', id);
        if (failed.status !== 'open') {
          throw new InvalidOperationError('Only open failed events can be replayed.', { statusCode: CONFLICT });
        }
        const event = await this.preparer.prepare(failed, this.writtenBy);
        saving = true;
        const replayedAs = await transaction.insertReplayedEvent(event);
        if (!replayedAs) throw new Error('Replay storage did not return an audit row ID.');
        await transaction.markReplayed(id, replayedAs);
        const replayAudit = await this.preparer.prepareAudit(
          this.replayRecord(id, replayedAs, administrator),
          tenantId,
        );
        await transaction.insertReplayAudit(replayAudit);
        return { ...failed, status: 'replayed', replayed_as: replayedAs };
      });
    } catch (err) {
      if (saving) this.metrics.recordWriteFailure('replay');
      throw err;
    }
  }

  private replayRecord(id: string, replayedAs: string, administrator: User): ReplayAuditRecord {
    return {
      namespace: 'audit-service',
      writtenBy: this.writtenBy,
      event: {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        action: `${REPLAY_ACTION}.succeeded`,
        status: 'success',
        actor: { id: administrator.id, type: 'user', roles: administrator.roles },
        resource: { type: 'failed-event', id },
        metadata: { replayedAs },
      },
    };
  }
}
