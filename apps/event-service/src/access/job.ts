import type { AuditService } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import type { Logger } from 'winston';
import { UserLoginFailedAuditAction } from './actions';
import type { LoginFailureLimiter } from './limiter';
import { toAccessAuditRecord } from './records';

interface AccessAuditJobProps {
  logger: Logger;
  auditService: AuditService;
  limiter: LoginFailureLimiter;
}

/**
 * Creates the job that records access service events in the audit service. Undelivered records fail the work item,
 * so it is requeued once and then dead lettered; rejected records are logged by the audit client and acknowledged.
 */
export const createAccessAuditJob =
  ({ logger, auditService, limiter }: AccessAuditJobProps) =>
  async (event: DomainEvent, done: (err?: unknown) => void): Promise<void> => {
    try {
      const record = toAccessAuditRecord(event);
      if (!record) {
        done();
        return;
      }
      if (record.action === UserLoginFailedAuditAction && !limiter.allow(event.tenantId)) {
        done();
        return;
      }

      const outcome = await auditService.record(record.action, record.details);
      if (outcome.status === 'failed') {
        done(
          new Error(`Audit record ${outcome.eventId} of ${record.action.name} was not delivered: ${outcome.reason}`),
        );
      } else {
        done();
      }
    } catch (err) {
      logger.error(`Error encountered recording access event ${event.namespace}:${event.name} in audit. ${err}`, {
        context: 'AccessAudit',
        tenantId: event.tenantId?.toString(),
      });
      done(err);
    }
  };
