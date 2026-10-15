import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Logger } from 'winston';
import { AuditConfiguration, RetentionSettings } from './configuration';

export const DEFAULT_RETENTION_CLASSES: RetentionSettings['classes'] = {
  standard: { days: 90 },
  security: { days: 365 },
  compliance: { days: 365 },
};
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export class RetentionService {
  constructor(
    private readonly configuration: ConfigurationService,
    private readonly logger: Logger,
  ) {}

  async getClasses(namespace: string, tenantId: AdspId): Promise<RetentionSettings['classes']> {
    try {
      const [settings, application] = await Promise.all([
        this.configuration.getServiceConfiguration<AuditConfiguration, AuditConfiguration | null>(
          'retention',
          tenantId,
        ),
        this.configuration.getServiceConfiguration<AuditConfiguration, AuditConfiguration | null>(
          `retention-${namespace}`,
          tenantId,
        ),
      ]);
      if (settings && settings.kind !== 'retentionSettings') {
        throw new Error('Expected retentionSettings in the retention configuration.');
      }
      if (
        application &&
        (application.kind !== 'applicationRetentionSettings' || application.application !== namespace)
      ) {
        throw new Error('Application retention settings do not match their configuration name.');
      }
      return {
        ...DEFAULT_RETENTION_CLASSES,
        ...(settings?.kind === 'retentionSettings' ? settings.classes : {}),
        ...(application?.kind === 'applicationRetentionSettings' ? application.classes : {}),
      };
    } catch (err) {
      this.logger.warn(`Unable to resolve retention settings for ${namespace}: ${err}`, {
        context: 'AuditRetention',
        tenant: tenantId.toString(),
      });
      throw new InvalidOperationError('Audit retention settings are temporarily unavailable.', { statusCode: 503 });
    }
  }
}

export function calculateRetentionUntil(
  occurredAt: Date,
  retentionClass: string,
  classes: RetentionSettings['classes'],
): Date {
  const period = Object.prototype.hasOwnProperty.call(classes, retentionClass) ? classes[retentionClass] : undefined;
  const until = occurredAt.getTime() + period?.days * MILLISECONDS_PER_DAY;
  if (!Number.isSafeInteger(period?.days) || period.days < 1 || !Number.isFinite(new Date(until).getTime())) {
    throw new InvalidOperationError(`Retention class '${retentionClass}' has no valid write-time period.`, {
      statusCode: 503,
    });
  }
  return new Date(until);
}
