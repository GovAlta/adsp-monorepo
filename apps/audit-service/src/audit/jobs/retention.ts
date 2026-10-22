import {
  AdspId,
  AuditActionDefinition,
  AuditCategories,
  AuditSeverities,
  BuiltInRetentionClasses,
  instrumentJob,
} from '@abgov/adsp-service-sdk';
import { randomUUID } from 'crypto';
import * as schedule from 'node-schedule';
import type { Logger } from 'winston';
import { AUDIT_SERVICE_NAMESPACE, CatalogService, RetentionService } from '../model';
import { AuditEvent, EnrichedEvent } from '../types';
import { enrichEvent, getActionDefinition } from '../utils/event-preparation';
import { ActionValidator } from '../utils/event-validation';

export const RETENTION_ACTION = 'retention.run';
export const RETENTION_DEFINITION: AuditActionDefinition = {
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  metadataSchema: {
    type: 'object',
    properties: {
      deletedCount: { type: 'integer', minimum: 0 },
      batches: { type: 'integer', minimum: 0 },
      cutoff: { type: 'string', format: 'date-time' },
      error: { type: 'string' },
    },
    required: ['deletedCount', 'batches', 'cutoff'],
    additionalProperties: false,
  },
};

export interface RetentionRunResult {
  deletedCount: number;
  batches: number;
  error?: string;
}

export interface RetentionJobOptions {
  batchSize: number;
  maxBatches: number;
}

export interface RetentionRepository {
  getTenantIds(): Promise<string[]>;
  run(
    tenantId: string,
    cutoff: Date,
    options: RetentionJobOptions,
    audit: (result: RetentionRunResult) => EnrichedEvent,
  ): Promise<RetentionRunResult | null>;
}

export function assertRetentionJobOptions({ batchSize, maxBatches }: RetentionJobOptions): void {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || !Number.isSafeInteger(maxBatches) || maxBatches < 1) {
    throw new Error('Retention batch size and maximum batches must be positive integers.');
  }
}

export class RetentionJob {
  constructor(
    private readonly repository: RetentionRepository,
    private readonly catalogs: CatalogService,
    private readonly retention: RetentionService,
    private readonly serviceId: AdspId,
    private readonly logger: Logger,
    private readonly options: RetentionJobOptions,
  ) {
    assertRetentionJobOptions(options);
  }

  async run(isStopping: () => boolean = () => false): Promise<void> {
    const cutoff = new Date();
    const tenants = await this.repository.getTenantIds();
    let failures = 0;
    for (const tenantId of tenants) {
      if (isStopping()) break;
      try {
        const audit = await this.prepareAudit(tenantId, cutoff);
        if (isStopping()) break;
        const result = await this.repository.run(tenantId, cutoff, this.options, audit);
        if (result?.error) throw new Error(result.error);
        this.logger.info(
          result ? `Retention deleted ${result.deletedCount} audit event(s).` : 'Retention lock busy; skipped.',
          {
            context: 'AuditRetention',
            tenant: tenantId,
          },
        );
      } catch (error) {
        failures++;
        this.logger.error(`Retention run failed: ${error}`, { context: 'AuditRetention', tenant: tenantId });
      }
    }
    if (failures) throw new Error(`Retention failed for ${failures} tenant(s).`);
  }

  private async prepareAudit(tenantId: string, cutoff: Date) {
    const tenant = AdspId.parse(tenantId);
    const catalog = await this.catalogs.getCatalog(AUDIT_SERVICE_NAMESPACE, tenant);
    const classes = await this.retention.getClasses(AUDIT_SERVICE_NAMESPACE, tenant);
    const definition = getActionDefinition({ action: RETENTION_ACTION }, catalog);
    const validator = new ActionValidator();
    return (result: RetentionRunResult): EnrichedEvent => {
      const now = new Date();
      const event: AuditEvent = {
        eventId: randomUUID(),
        occurredAt: now.toISOString(),
        action: `${RETENTION_ACTION}.${result.error ? 'failed' : 'succeeded'}`,
        status: result.error ? 'failure' : 'success',
        actor: { id: this.serviceId.toString(), type: 'system' },
        metadata: { ...result, cutoff: cutoff.toISOString() },
      };
      validator.validate(event, definition);
      return enrichEvent(
        event,
        definition,
        {
          tenantId,
          namespace: AUDIT_SERVICE_NAMESPACE,
          writtenBy: this.serviceId.toString(),
          receivedAt: now,
        },
        classes,
      );
    };
  }
}

export function scheduleRetentionJob(job: RetentionJob, cron: string, logger: Logger): { stop: () => Promise<void> } {
  let stopping = false;
  let active: Promise<void> | undefined;
  const run = instrumentJob(
    'audit-retention',
    async () => {
      if (stopping || active) return;
      active = job.run(() => stopping);
      try {
        await active;
      } finally {
        active = undefined;
      }
    },
    { logger },
  );
  const scheduled = schedule.scheduleJob({ rule: cron, tz: 'Etc/UTC' }, run);
  if (!scheduled) throw new Error('Invalid audit retention schedule.');
  logger.info(`Scheduled audit retention: ${cron} (UTC).`, { context: 'AuditRetention' });
  return {
    stop: async () => {
      stopping = true;
      scheduled.cancel();
      await active?.catch((error) =>
        logger.error(`Retention failed while draining: ${error}`, { context: 'AuditRetention' }),
      );
    },
  };
}
