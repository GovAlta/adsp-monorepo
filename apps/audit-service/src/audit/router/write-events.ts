import { InvalidOperationError } from '@core-services/core-common';
import { RequestHandler } from 'express';
import type { Logger } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { CatalogService, RetentionService } from '../model';
import { ActionValidator, EventRejectedError, validateEventEnvelope } from '../utils/event-validation';
import { enrichEvent, getActionDefinition, WriteContext } from '../utils/enrich-event';
import { EnrichedEvent, EventSubmitter, RejectedEvent, WriteEventsResponse } from '../types';
import { getWriterClientId } from '../utils/write-access';

interface WriteEventsDependencies {
  catalogs: CatalogService;
  retention: RetentionService;
  logger: Logger;
  submitter?: EventSubmitter;
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
