import { AuditActionDefinition } from '@abgov/adsp-service-sdk';
import { randomUUID } from 'crypto';
import { ActionCatalog, RetentionSettings } from '../configuration';
import { calculateRetentionUntil } from '../model/retention';
import { AuditEvent, EnrichedEvent } from '../types';
import { EventRejectedError, getCapturedChangeSet } from './event-validation';

export interface WriteContext {
  tenantId: string;
  namespace: string;
  writtenBy: string;
  receivedAt: Date;
}

export function getActionDefinition(
  event: Pick<AuditEvent, 'action'>,
  catalog: ActionCatalog | null,
): AuditActionDefinition {
  const name = event.action.replace(/\.(succeeded|failed)$/, '');
  if (!catalog || !Object.prototype.hasOwnProperty.call(catalog.actions, name)) {
    throw new EventRejectedError('unknown_action', `Action '${event.action}' is not registered.`);
  }
  return catalog.actions[name];
}

export function enrichEvent(
  event: AuditEvent,
  definition: AuditActionDefinition,
  context: WriteContext,
  classes: RetentionSettings['classes'],
): EnrichedEvent {
  const changeSet = getCapturedChangeSet(event, definition);
  const occurredAt = new Date(event.occurredAt);
  return {
    id: randomUUID(),
    event_id: event.eventId.toLowerCase(),
    tenant_id: context.tenantId,
    namespace: context.namespace,
    written_by: context.writtenBy,
    occurred_at: occurredAt,
    received_at: context.receivedAt,
    action: event.action,
    action_version: definition.version,
    category: definition.category,
    status: event.status,
    severity: definition.severity,
    actor_id: event.actor.id,
    actor_type: event.actor.type,
    actor_name: event.actor.name ?? null,
    actor_email: event.actor.email ?? null,
    actor_roles: event.actor.roles ?? [],
    resource_type: event.resource?.type ?? null,
    resource_id: event.resource?.id ?? null,
    resource_name: event.resource?.name ?? null,
    scope_ids: event.scopeIds ?? [],
    correlation_id: event.correlationId ?? null,
    session_id: event.sessionId ?? null,
    change_set_before: changeSet.before ?? null,
    change_set_after: changeSet.after ?? null,
    metadata: event.metadata ?? {},
    retention_class: definition.retentionClass,
    retention_until: calculateRetentionUntil(occurredAt, definition.retentionClass, classes),
    originalEvent: event,
  };
}
