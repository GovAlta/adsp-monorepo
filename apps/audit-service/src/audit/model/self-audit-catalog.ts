import { AuditActionDefinition } from '@abgov/adsp-service-sdk';
import { ActionCatalog } from '../configuration';

export const AUDIT_SERVICE_NAMESPACE = 'audit-service';

export const SelfAuditActions = {
  ListNamespaceEvents: 'events.list',
  ListAllEvents: 'events.list-all',
  ReadEvent: 'events.read',
  ListFailedEvents: 'failed-events.list',
  ReplayFailedEvents: 'failed-events.replay',
} as const;

export type SelfAuditAction = (typeof SelfAuditActions)[keyof typeof SelfAuditActions];

// One schema for every action: each records the endpoint, the filters supplied and the number of events returned.
const metadataSchema = {
  type: 'object',
  properties: {
    endpoint: { type: 'string', maxLength: 256 },
    filters: { type: 'object' },
    resultCount: { type: 'integer', minimum: 0 },
  },
  required: ['endpoint', 'resultCount'],
  additionalProperties: false,
};

// Reads of the audit trail are security relevant, so they are retained under the 'security' class.
const readAction = (description: string): AuditActionDefinition => ({
  version: 1,
  category: 'data-access',
  severity: 'info',
  retentionClass: 'security',
  description,
  metadataSchema,
});

export const AUDIT_SERVICE_CATALOG: ActionCatalog = {
  kind: 'actionCatalog',
  application: AUDIT_SERVICE_NAMESPACE,
  actions: {
    [SelfAuditActions.ListNamespaceEvents]: readAction('Listed the audit events of one namespace.'),
    [SelfAuditActions.ListAllEvents]: readAction('Listed audit events across all namespaces.'),
    [SelfAuditActions.ReadEvent]: readAction('Read a single audit event.'),
    [SelfAuditActions.ListFailedEvents]: readAction('Listed failed audit events.'),
    // Replay writes events back into the trail rather than reading it.
    [SelfAuditActions.ReplayFailedEvents]: {
      ...readAction('Replayed failed audit events into the trail.'),
      category: 'administrative',
    },
  },
};
