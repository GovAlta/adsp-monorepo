import { AuditActionDefinition } from '@abgov/adsp-service-sdk';

export interface AuditEvent {
  eventId: string;
  occurredAt: string;
  action: string;
  actionVersion?: number;
  status: 'success' | 'failure' | 'blocked' | 'error';
  actor: {
    id: string;
    type: 'user' | 'service' | 'system';
    name?: string;
    email?: string;
    roles?: string[];
  };
  resource?: { type: string; id: string; name?: string };
  scopeIds?: string[];
  correlationId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  changeSet?: unknown;
}

export interface EnrichedEvent {
  id: string;
  event_id: string;
  tenant_id: string;
  namespace: string;
  written_by: string;
  occurred_at: Date;
  received_at: Date;
  action: string;
  action_version: number;
  category: AuditActionDefinition['category'];
  status: AuditEvent['status'];
  severity: AuditActionDefinition['severity'];
  actor_id: string;
  actor_type: AuditEvent['actor']['type'];
  actor_name: string | null;
  actor_email: string | null;
  actor_roles: string[];
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  scope_ids: string[];
  correlation_id: string | null;
  session_id: string | null;
  change_set_before: Record<string, unknown> | null;
  change_set_after: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  retention_class: string;
  retention_until: Date;
  // The buffer needs the unmodified input when parking a failed write; this is not an audit_events column.
  originalEvent: unknown;
}

export type StoredEvent = Omit<EnrichedEvent, 'originalEvent'>;

export interface EventCriteria {
  tenantId: string;
  namespace?: string;
  actor?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  status?: AuditEvent['status'];
  category?: AuditActionDefinition['category'];
  scope?: string;
  occurredFrom?: Date;
  occurredTo?: Date;
}

export interface EventCursor {
  occurredAt: Date;
  id: string;
}

export interface EventReader {
  // Newest first by (occurred_at, id). `after` is the last event of the previous page; only events
  // strictly older in that ordering are returned, so paging is stable while new events arrive.
  find(criteria: EventCriteria, top: number, after?: EventCursor): Promise<StoredEvent[]>;
  // Must match tenant and namespace, so an id from another tenant is never returned.
  get(tenantId: string, namespace: string, id: string): Promise<StoredEvent | null>;
}

// Namespace of the events the service records about itself (replays and audited reads).
export const AUDIT_SERVICE_NAMESPACE = 'audit-service';

export const EVENT_OUTCOME_STATUS = {
  ACCEPTED: 'accepted',
  DUPLICATE: 'duplicate',
  REJECTED: 'rejected',
} as const;

export const EVENT_OUTCOME_CODE = {
  STORAGE_FAILED: 'storage_failed',
} as const;

export type EventOutcome =
  | { status: typeof EVENT_OUTCOME_STATUS.ACCEPTED }
  | { status: typeof EVENT_OUTCOME_STATUS.DUPLICATE }
  | {
      status: typeof EVENT_OUTCOME_STATUS.REJECTED;
      code: typeof EVENT_OUTCOME_CODE.STORAGE_FAILED;
      reason: string;
    };

export interface EventSubmitter {
  submit(events: EnrichedEvent[]): Promise<Map<string, EventOutcome>>;
}

export interface RejectedEvent {
  index: number;
  eventId?: string;
  code: string;
  reason: string;
}

export interface WriteEventsResponse {
  accepted: number;
  duplicates: number;
  rejected: RejectedEvent[];
}
