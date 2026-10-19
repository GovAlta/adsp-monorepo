import { User } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, InvalidOperationError, NotFoundError, Results } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import { CONFLICT, SERVICE_UNAVAILABLE } from 'http-status-codes';
import { AuditMetrics } from '../metrics';
import { FailedAuditEvent, FailedEventRepository, ReplayAuditRecord } from '../types';

export class FailedEventService {
  constructor(
    private readonly repository: FailedEventRepository | undefined,
    private readonly writtenBy: string,
    private readonly metrics: AuditMetrics,
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
    const skip = decodeAfter(after);
    const results = await this.requireRepository().list(tenantId, top, skip);
    if (results.length > top || results.some((event) => event.tenant_id !== tenantId)) {
      throw new InvalidOperationError('Failed-event storage returned an invalid tenant page.', {
        statusCode: SERVICE_UNAVAILABLE,
      });
    }
    return { results, page: { after, size: results.length, next: encodeNext(results.length, top, skip) } };
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
        saving = true;
        const replayedAs = await transaction.insertReplayedEvent(failed, this.writtenBy);
        if (!replayedAs) throw new Error('Replay storage did not return an audit row ID.');
        await transaction.markReplayed(id, replayedAs);
        await transaction.insertReplayAudit(this.replayRecord(id, replayedAs, administrator));
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
        action: 'failed-event.replay.succeeded',
        status: 'success',
        actor: { id: administrator.id, type: 'user', roles: administrator.roles },
        resource: { type: 'failed-event', id },
        metadata: { replayedAs },
      },
    };
  }
}
