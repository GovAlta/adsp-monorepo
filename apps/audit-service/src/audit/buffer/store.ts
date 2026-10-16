import { InvalidOperationError } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import type { EnrichedEvent } from '../types';

export interface AuditStoreContext {
  signal: AbortSignal;
}

export interface FailedAuditEvent {
  id: string;
  tenant_id: string;
  namespace: string;
  event_id: string;
  event: unknown;
  error: string;
  attempt_count: number;
  failed_at: Date;
  status: 'open';
}

export interface AuditEventStore {
  // Resolve only after commit. Return inserted service IDs, not client event_id values.
  insert(events: readonly EnrichedEvent[], context: AuditStoreContext): Promise<readonly string[]>;
  // Resolve only when every supplied failure record has committed.
  park(events: readonly FailedAuditEvent[], context: AuditStoreContext): Promise<void>;
}

export class AuditStoreError extends Error {
  constructor(
    message: string,
    readonly kind: 'transient' | 'constraint' | 'permanent',
  ) {
    super(message);
    this.name = 'AuditStoreError';
    Object.setPrototypeOf(this, AuditStoreError.prototype);
  }
}

export class AuditStorageUnavailableError extends InvalidOperationError {
  constructor(message: string) {
    super(message, { statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE });
    Object.setPrototypeOf(this, AuditStorageUnavailableError.prototype);
  }
}
