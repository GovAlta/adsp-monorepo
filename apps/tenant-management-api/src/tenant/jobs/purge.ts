import { AdspId, AuditService, EventService, instrumentJob, User } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { tenantDeleted } from '../events';
import { TenantRepository } from '../repository';
import { RealmService } from '../services/realm';
import { mapTenant } from '../router/mappers';
import { removeTenant } from '../router/tenantV2';

const LOG_CONTEXT = { context: 'TenantPurgeJob' };
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface TenantPurgeJobProps {
  serviceId: AdspId;
  logger: Logger;
  tenantRepository: TenantRepository;
  realmService: RealmService;
  eventService: EventService;
  auditService: AuditService;
  retentionDays: number;
}

// The job has no request user, so the tenant service account is the actor of the purge.
function toSystemUser(serviceId: AdspId): User {
  return {
    id: serviceId.toString(),
    name: `service-account-${serviceId.service}`,
    email: null,
    roles: [],
    isCore: true,
    token: null,
  };
}

export function createTenantPurgeJob({
  serviceId,
  logger,
  tenantRepository,
  realmService,
  eventService,
  auditService,
  retentionDays,
}: TenantPurgeJobProps) {
  const user = toSystemUser(serviceId);

  return async (): Promise<void> => {
    const cutoff = new Date(Date.now() - retentionDays * MS_PER_DAY);
    const expired = await tenantRepository.find({ statusEquals: 'archived', deletedBefore: cutoff });
    logger.info(`Purging ${expired.length} tenant(s) archived before ${cutoff.toISOString()}.`, LOG_CONTEXT);

    let purged = 0;
    for (const entity of expired) {
      try {
        const tenant = mapTenant(entity);
        const { deletedTenant, success } = await removeTenant(entity, user, realmService, auditService);
        if (deletedTenant) {
          eventService.send(tenantDeleted(user, { ...tenant, id: AdspId.parse(tenant.id) }));
        }

        if (success) {
          purged++;
        } else {
          logger.warn(`Purge of tenant ${entity.name} (${entity.id}) did not fully complete.`, LOG_CONTEXT);
        }
      } catch (err) {
        logger.error(`Failed to purge tenant ${entity.name} (${entity.id}): ${err}`, LOG_CONTEXT);
      }
    }

    logger.info(`Purged ${purged} of ${expired.length} tenant(s).`, LOG_CONTEXT);
  };
}

export function scheduleTenantPurgeJob(props: TenantPurgeJobProps & { cron: string }): schedule.Job {
  const job = schedule.scheduleJob(
    { rule: props.cron, tz: 'Etc/UTC' },
    instrumentJob('tenant-purge', createTenantPurgeJob(props), { logger: props.logger }),
  );
  if (!job) {
    throw new Error(`Invalid tenant purge schedule: ${props.cron}`);
  }

  props.logger.info(`Scheduled tenant purge job: ${props.cron} (UTC).`, LOG_CONTEXT);
  return job;
}
