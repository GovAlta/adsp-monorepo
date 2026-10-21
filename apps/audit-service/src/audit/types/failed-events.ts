import { AuditEvent, EnrichedEvent } from './events';

export interface FailedAuditEvent {
  id: string;
  tenant_id: string;
  namespace: string;
  event_id: string | null;
  event: unknown;
  error: string;
  attempts: number;
  failed_at: Date;
  status: 'open' | 'replayed' | 'discarded';
  replayed_as: string | null;
}

export interface ReplayAuditRecord {
  namespace: 'audit-service';
  writtenBy: string;
  event: AuditEvent;
}

// All methods use the trusted transaction tenant, never a tenant from the stored payload.
export interface FailedEventReplayTransaction {
  getForUpdate(id: string): Promise<FailedAuditEvent | null>;
  // Insert idempotently and return the stored audit_events row ID, not the caller's event_id.
  insertReplayedEvent(event: EnrichedEvent): Promise<string>;
  markReplayed(id: string, replayedAs: string): Promise<void>;
  insertReplayAudit(event: EnrichedEvent): Promise<void>;
}

export interface FailedEventCursor {
  failedAt: Date;
  id: string;
}

export interface FailedEventRepository {
  // Tenant-filtered, ordered by failed_at DESC, id DESC, including all three statuses.
  // `after` is the last row of the previous page; only strictly older rows are returned.
  list(tenantId: string, top: number, after?: FailedEventCursor): Promise<FailedAuditEvent[]>;
  // Privileged aggregate across tenants; no event data leaves the repository.
  countOpen(): Promise<number>;
  // Resolve only after commit. Lock the failed row and roll back ALL writes on any failure,
  // including self-auditing. Concurrent replays must serialize on the same tenant + row.
  withReplayTransaction<T>(
    tenantId: string,
    work: (transaction: FailedEventReplayTransaction) => Promise<T>,
  ): Promise<T>;
}
