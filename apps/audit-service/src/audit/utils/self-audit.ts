import { AdspId } from '@abgov/adsp-service-sdk';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import type { Logger } from 'winston';
import { AUDIT_SERVICE_NAMESPACE, CatalogService, RetentionService, SelfAuditAction } from '../model';
import { EnrichedEvent, EventSubmitter } from '../types';
import { enrichEvent, getActionDefinition } from './enrich-event';
import { ActionValidator, EventRejectedError } from './event-validation';

export interface SelfAuditRecord {
  action: SelfAuditAction;
  endpoint: string;
  filters?: Record<string, unknown>;
  resultCount: number;
}

interface SelfAuditorOptions {
  serviceId: AdspId;
  catalogs: CatalogService;
  retention: RetentionService;
  submitter?: EventSubmitter;
  logger: Logger;
}

const MAX_CORRELATION_ID_LENGTH = 128;

// Keycloak names service account users with this prefix.
const SERVICE_ACCOUNT_PREFIX = 'service-account-';

/**
 * Records reads of the audit trail as events in the service's own namespace.
 * Events go through the same validation, enrichment and buffer as any other write, and recording
 * never fails the read that triggered it.
 */
export class SelfAuditor {
  private failures = 0;
  private readonly validator = new ActionValidator();

  constructor(private readonly options: SelfAuditorOptions) {}

  get failureCount(): number {
    return this.failures;
  }

  async record(req: Request, { action, endpoint, filters, resultCount }: SelfAuditRecord): Promise<void> {
    const { serviceId, catalogs, retention, submitter, logger } = this.options;
    const tenantId = req.tenant?.id;
    try {
      const user = req.user;
      if (!tenantId || !user) {
        throw new Error('Request has no tenant or user context.');
      }

      if (!submitter) {
        throw new Error('Audit event storage is not configured.');
      }

      const now = new Date();
      const header = req.get?.('x-correlation-id');
      const correlationId = header && header.length <= MAX_CORRELATION_ID_LENGTH ? header : undefined;
      const event = {
        eventId: randomUUID(),
        occurredAt: now.toISOString(),
        action,
        status: 'success' as const,
        actor: {
          id: user.id,
          type: user.name?.startsWith(SERVICE_ACCOUNT_PREFIX) ? ('service' as const) : ('user' as const),
          name: user.name || undefined,
          email: user.email || undefined,
          roles: user.roles,
        },
        ...(correlationId ? { correlationId } : {}),
        metadata: { endpoint, resultCount, ...(filters && Object.keys(filters).length ? { filters } : {}) },
      };

      const catalog = await catalogs.getCatalog(AUDIT_SERVICE_NAMESPACE, tenantId);
      const classes = await retention.getClasses(AUDIT_SERVICE_NAMESPACE, tenantId);
      const definition = getActionDefinition(event, catalog);
      this.validator.validate(event, definition);
      const enriched: EnrichedEvent = enrichEvent(
        event,
        definition,
        {
          tenantId: tenantId.toString(),
          namespace: AUDIT_SERVICE_NAMESPACE,
          writtenBy: serviceId.toString(),
          receivedAt: now,
        },
        classes,
      );

      const outcome = (await submitter.submit([enriched])).get(enriched.id);
      if (outcome?.status === 'rejected') {
        throw new Error(`Event rejected: ${outcome.reason}`);
      }
    } catch (err) {
      this.failures++;
      logger.error(`Failed to record audit trail read '${action}': ${err}`, {
        context: 'AuditSelfAudit',
        tenant: tenantId?.toString(),
        failures: this.failures,
        ...(err instanceof EventRejectedError ? { code: err.code } : {}),
      });
    }
  }
}
