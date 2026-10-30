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
      const { tenant, application } = await this.resolve(tenantId, namespace);
      const classes = { ...DEFAULT_RETENTION_CLASSES, ...tenant, ...application };
      this.assertBounds(classes);
      return classes;
    } catch (err) {
      throw this.unavailable(`Unable to resolve retention settings for ${namespace}: ${err}`, tenantId);
    }
  }

  // The configured periods only (no defaults), resolved as at write time: SDK active revision with Core merged.
  async getConfigured(
    tenantId: AdspId,
    namespaces: string[],
  ): Promise<{ tenant: RetentionSettings['classes']; applications: Record<string, RetentionSettings['classes']> }> {
    try {
      const { tenant } = await this.resolve(tenantId);
      this.assertBounds(tenant);
      const resolved = await Promise.all(
        namespaces.map(async (namespace) => [namespace, (await this.resolve(tenantId, namespace)).application] as const),
      );
      const applications: Record<string, RetentionSettings['classes']> = {};
      for (const [namespace, classes] of resolved) {
        if (Object.keys(classes).length > 0) {
          this.assertBounds({ ...tenant, ...classes });
          applications[namespace] = classes;
        }
      }
      return { tenant, applications };
    } catch (err) {
      throw this.unavailable(`Unable to resolve configured retention settings: ${err}`, tenantId);
    }
  }

  private async resolve(
    tenantId: AdspId,
    namespace?: string,
  ): Promise<{ tenant: RetentionSettings['classes']; application: RetentionSettings['classes'] }> {
    const [settings, application] = await Promise.all([
      this.configuration.getServiceConfiguration<AuditConfiguration, AuditConfiguration | null>('retention', tenantId),
      namespace
        ? this.configuration.getServiceConfiguration<AuditConfiguration, AuditConfiguration | null>(
            `retention-${namespace}`,
            tenantId,
          )
        : Promise.resolve(null),
    ]);
    if (settings && settings.kind !== 'retentionSettings') {
      throw new Error('Expected retentionSettings in the retention configuration.');
    }
    if (application && (application.kind !== 'applicationRetentionSettings' || application.application !== namespace)) {
      throw new Error('Application retention settings do not match their configuration name.');
    }
    return {
      tenant: settings?.kind === 'retentionSettings' ? settings.classes : {},
      application: application?.kind === 'applicationRetentionSettings' ? application.classes : {},
    };
  }

  private assertBounds(classes: RetentionSettings['classes']) {
    for (const [name, { days }] of Object.entries(classes)) {
      if (!Number.isSafeInteger(days) || days < this.bounds.minDays || days > this.bounds.maxDays) {
        throw new Error(
          `Retention class '${name}' must be between ${this.bounds.minDays} and ${this.bounds.maxDays} days.`,
        );
      }
    }
  }

  private unavailable(message: string, tenantId: AdspId) {
    this.logger.warn(message, { context: 'AuditRetention', tenant: tenantId.toString() });
    return new InvalidOperationError('Audit retention settings are temporarily unavailable.', {
      statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
    });
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
