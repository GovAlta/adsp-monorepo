import { AdspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { SERVICE_UNAVAILABLE } from 'http-status-codes';
import { FailedAuditEvent, ReplayAuditRecord } from '../types';
import { ActionValidator, EventRejectedError, validateEventEnvelope } from '../utils/event-validation';
import { enrichEvent, getActionDefinition } from '../utils/event-preparation';
import { CatalogService } from './catalog';
import { RetentionService } from './retention';

export class ReplayEventPreparer {
  constructor(
    private readonly catalogs: CatalogService,
    private readonly retention: RetentionService,
  ) {}

  async prepare(failed: FailedAuditEvent, writtenBy: string) {
    try {
      const receivedAt = new Date();
      const event = validateEventEnvelope(failed.event, receivedAt, { allowHistorical: true });
      if (failed.event_id && event.eventId.toLowerCase() !== failed.event_id.toLowerCase()) {
        throw new EventRejectedError('invalid_event', 'Stored event identity does not match the failed row.');
      }
      const tenantId = AdspId.parse(failed.tenant_id);
      const catalog = await this.catalogs.getCatalog(failed.namespace, tenantId);
      const definition = getActionDefinition(event, catalog);
      new ActionValidator().validate(event, definition);
      const classes = await this.retention.getClasses(failed.namespace, tenantId);
      return enrichEvent(
        event,
        definition,
        {
          tenantId: failed.tenant_id,
          namespace: failed.namespace,
          writtenBy,
          receivedAt,
        },
        classes,
      );
    } catch (error) {
      if (error instanceof EventRejectedError) {
        throw new InvalidOperationError(
          `Stored event cannot be replayed (${error.code}). Check its action catalog and payload.`,
        );
      }
      throw error;
    }
  }

  async prepareAudit(record: ReplayAuditRecord, tenantId: string) {
    try {
      const tenant = AdspId.parse(tenantId);
      const catalog = await this.catalogs.getCatalog(record.namespace, tenant);
      const definition = getActionDefinition(record.event, catalog);
      new ActionValidator().validate(record.event, definition);
      const classes = await this.retention.getClasses(record.namespace, tenant);
      return enrichEvent(
        record.event,
        definition,
        {
          tenantId,
          namespace: record.namespace,
          writtenBy: record.writtenBy,
          receivedAt: new Date(),
        },
        classes,
      );
    } catch (error) {
      if (error instanceof EventRejectedError) {
        throw new InvalidOperationError(
          'Replay audit action is unavailable or incompatible. Check its registered action catalog and retry.',
          { statusCode: SERVICE_UNAVAILABLE },
        );
      }
      throw error;
    }
  }
}
