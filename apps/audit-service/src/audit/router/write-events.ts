import { AuditActionDefinition } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';
import type { Logger } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { CatalogService, RetentionService } from '../model';
import { ActionCatalog, RetentionSettings } from '../configuration';
import {
  ActionValidator,
  EventRejectedError,
  getCapturedChangeSet,
  validateEventEnvelope,
} from '../utils/event-validation';
import { calculateRetentionUntil } from '../model/retention';
import { AuditEvent, EnrichedEvent, EventSubmitter, RejectedEvent, WriteEventsResponse } from '../types';
import { getWriterClientId } from '../utils/write-access';

interface WriteEventsDependencies {
  catalogs: CatalogService;
  retention: RetentionService;
  logger: Logger;
  submitter?: EventSubmitter;
}

interface WriteContext {
  tenantId: string;
  namespace: string;
  writtenBy: string;
  receivedAt: Date;
}

function getActionDefinition(event: AuditEvent, catalog: ActionCatalog | null): AuditActionDefinition {
  const name = event.action.replace(/\.(succeeded|failed)$/, '');
  if (!catalog || !Object.prototype.hasOwnProperty.call(catalog.actions, name)) {
    throw new EventRejectedError('unknown_action', `Action '${event.action}' is not registered.`);
  }
  return catalog.actions[name];
}

function enrichEvent(
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

function rejectedEvent(input: unknown, index: number, code: string, reason: string): RejectedEvent {
  const eventId = input && typeof input === 'object' && 'eventId' in input ? input.eventId : undefined;
  return {
    index,
    ...(typeof eventId === 'string' && eventId.length <= 36 ? { eventId } : {}),
    code,
    reason,
  };
}

async function submitEvents(
  submitter: EventSubmitter | undefined,
  prepared: { event: EnrichedEvent; index: number }[],
  response: WriteEventsResponse,
): Promise<void> {
  if (!prepared.length) return;
  if (!submitter) {
    throw new InvalidOperationError('Audit event storage is not configured.', {
      statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
    });
  }
  const outcomes = await submitter.submit(prepared.map(({ event }) => event));
  if (!(outcomes instanceof Map) || outcomes.size !== prepared.length) {
    throw new InvalidOperationError('Audit storage returned an incomplete submission result.', {
      statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
    });
  }
  for (const { event, index } of prepared) {
    const outcome = outcomes.get(event.id);
    switch (outcome?.status) {
      case 'accepted':
        response.accepted++;
        break;
      case 'duplicate':
        response.duplicates++;
        break;
      case 'rejected':
        if (outcome.code !== 'storage_failed' || typeof outcome.reason !== 'string' || !outcome.reason.trim()) {
          throw new InvalidOperationError('Audit storage returned an invalid rejection.', {
            statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
          });
        }
        response.rejected.push(rejectedEvent(event.originalEvent, index, outcome.code, outcome.reason));
        break;
      default:
        throw new InvalidOperationError('Audit storage did not account for every event.', {
          statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
        });
    }
  }
}

export function writeEvents({ catalogs, retention, submitter, logger }: WriteEventsDependencies): RequestHandler {
  return async (req, res, next) => {
    try {
      const { namespace } = req.params;
      const tenantId = req.tenant.id;
      const context: WriteContext = {
        namespace,
        tenantId: tenantId.toString(),
        writtenBy: getWriterClientId(req.user).toString(),
        receivedAt: new Date(),
      };
      const inputs: unknown[] = req.body.events;
      const catalog = await catalogs.getCatalog(namespace, tenantId);
      const classes = catalog ? await retention.getClasses(namespace, tenantId) : {};
      const validator = new ActionValidator();
      const response: WriteEventsResponse = { accepted: 0, duplicates: 0, rejected: [] };
      const prepared: { event: EnrichedEvent; index: number }[] = [];
      inputs.forEach((input, index) => {
        try {
          const event = validateEventEnvelope(input, context.receivedAt);
          const definition = getActionDefinition(event, catalog);
          validator.validate(event, definition);
          prepared.push({ event: enrichEvent(event, definition, context, classes), index });
        } catch (err) {
          if (!(err instanceof EventRejectedError)) throw err;
          response.rejected.push(rejectedEvent(input, index, err.code, err.message));
        }
      });
      await submitEvents(submitter, prepared, response);
      response.rejected.sort((left, right) => left.index - right.index);
      res.status(HttpStatusCodes.ACCEPTED).send(response);
    } catch (err) {
      logger.warn(`Unable to submit audit events: ${err}`, {
        context: 'AuditWrite',
        tenant: req.tenant?.id.toString(),
      });
      if (err instanceof InvalidOperationError && err.extra?.statusCode === HttpStatusCodes.SERVICE_UNAVAILABLE)
        res.setHeader('Retry-After', '1');
      next(err);
    }
  };
}
