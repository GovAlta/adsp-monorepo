import { AuditEvent } from './events';

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

// All methods use the transaction's tenant/RLS context, never a tenant from the stored payload.
export interface FailedEventReplayTransaction {
  getForUpdate(id: string): Promise<FailedAuditEvent | null>;
  // Validate/enrich the stored input without the ingestion age limit; preserve its original actor.
  // Insert idempotently and return the stored audit_events row ID, not the caller's event_id.
  insertReplayedEvent(failedEvent: FailedAuditEvent, writtenBy: string): Promise<string>;
  markReplayed(id: string, replayedAs: string): Promise<void>;
  insertReplayAudit(record: ReplayAuditRecord): Promise<void>;
}

export interface FailedEventRepository {
  // Tenant-filtered, ordered by failed_at DESC, id DESC, including all three statuses.
  list(tenantId: string, top: number, skip: number): Promise<FailedAuditEvent[]>;
  // Privileged aggregate across tenants; no event data leaves the repository.
  countOpen(): Promise<number>;
  // Resolve only after commit. Lock the failed row and roll back ALL writes on any failure,
  // including self-auditing. Concurrent replays must serialize on the same tenant + row.
  withReplayTransaction<T>(
    tenantId: string,
    work: (transaction: FailedEventReplayTransaction) => Promise<T>,
  ): Promise<T>;
}
