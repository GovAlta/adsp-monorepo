import { AdspId, BuiltInRetentionClasses, ConfigurationService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Logger } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import {
  assertRetentionBounds,
  AuditConfiguration,
  DEFAULT_RETENTION_BOUNDS,
  RetentionBounds,
  RetentionSettings,
} from '../configuration';

export const DEFAULT_RETENTION_CLASSES: RetentionSettings['classes'] = {
  [BuiltInRetentionClasses.Standard]: { days: 90 },
  [BuiltInRetentionClasses.Security]: { days: 365 },
  [BuiltInRetentionClasses.Compliance]: { days: 365 },
};
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export class RetentionService {
  constructor(
    private readonly configuration: ConfigurationService,
    private readonly logger: Logger,
    private readonly bounds: RetentionBounds = DEFAULT_RETENTION_BOUNDS,
  ) {
    assertRetentionBounds(bounds);
  }

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
      const classes = {
        ...DEFAULT_RETENTION_CLASSES,
        ...(settings?.kind === 'retentionSettings' ? settings.classes : {}),
        ...(application?.kind === 'applicationRetentionSettings' ? application.classes : {}),
      };
      for (const [name, { days }] of Object.entries(classes)) {
        if (!Number.isSafeInteger(days) || days < this.bounds.minDays || days > this.bounds.maxDays) {
          throw new Error(
            `Retention class '${name}' must be between ${this.bounds.minDays} and ${this.bounds.maxDays} days.`,
          );
        }
      }
      return classes;
    } catch (err) {
      this.logger.warn(`Unable to resolve retention settings for ${namespace}: ${err}`, {
        context: 'AuditRetention',
        tenant: tenantId.toString(),
      });
      throw new InvalidOperationError('Audit retention settings are temporarily unavailable.', {
        statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
      });
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
      statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
    });
  }
  return new Date(until);
}
