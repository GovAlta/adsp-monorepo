import { AdspId, AuditService, instrumentJob } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { TenantCreatedAuditAction, toTenantAuditDetails } from '../audit';
import { TenantEntity } from '../models';
import { TenantRepository } from '../repository';
import { mapTenant } from '../router/mappers';
import { removeTenant } from '../router/tenantV2';
import { RealmService } from '../services/realm';
import { toSystemUser } from './purge';

const LOG_CONTEXT = { context: 'TenantProvisioningRecoveryJob' };
const MS_PER_MINUTE = 60 * 1000;

interface TenantProvisioningRecoveryJobProps {
  serviceId: AdspId;
  logger: Logger;
  tenantRepository: TenantRepository;
  realmService: RealmService;
  auditService: AuditService;
  staleAfterMinutes: number;
}

// Read again just before removal: a slow provisioning may have finished, or failed and cleaned up, since the find.
async function stillProvisioning(tenantRepository: TenantRepository, id: string): Promise<TenantEntity | null> {
  try {
    const entity = await tenantRepository.get(id);
    return entity?.status === 'provisioning' ? entity : null;
  } catch (err) {
    if (err instanceof NotFoundError) {
      return null;
    }
    throw err;
  }
}

/**
 * Removes tenants still `provisioning` after `staleAfterMinutes`: their provisioning stopped, for example when the
 * process restarted, and nothing else would finish or remove them. Removal deletes any partly created realm and
 * broker client, and the record, so the name can be used again.
 */
export function createTenantProvisioningRecoveryJob({
  serviceId,
  logger,
  tenantRepository,
  realmService,
  auditService,
  staleAfterMinutes,
}: TenantProvisioningRecoveryJobProps) {
  const user = toSystemUser(serviceId);

  return async (): Promise<void> => {
    const cutoff = new Date(Date.now() - staleAfterMinutes * MS_PER_MINUTE);
    const stuck = await tenantRepository.find({ statusEquals: 'provisioning', createdBefore: cutoff });
    if (stuck.length === 0) {
      return;
    }
    logger.warn(
      `Found ${stuck.length} tenant(s) still provisioning since before ${cutoff.toISOString()}.`,
      LOG_CONTEXT,
    );

    let removed = 0;
    for (const found of stuck) {
      try {
        const entity = await stillProvisioning(tenantRepository, found.id);
        if (!entity) {
          continue;
        }

        await auditService.record(
          TenantCreatedAuditAction,
          toTenantAuditDetails(user, mapTenant(entity), {
            status: 'failure',
            metadata: {
              realmProvisioning: 'new',
              error: `Provisioning didn't finish within ${staleAfterMinutes} minutes.`,
            },
          }),
        );
        const { success } = await removeTenant(entity, user, realmService, auditService);
        if (success) {
          removed++;
        } else {
          logger.warn(`Removal of stuck tenant ${entity.name} (${entity.id}) did not fully complete.`, LOG_CONTEXT);
        }
      } catch (err) {
        logger.error(`Failed to remove stuck tenant ${found.name} (${found.id}): ${err}`, LOG_CONTEXT);
      }
    }

    logger.info(`Removed ${removed} of ${stuck.length} stuck tenant(s).`, LOG_CONTEXT);
  };
}

export function scheduleTenantProvisioningRecoveryJob(
  props: TenantProvisioningRecoveryJobProps & { cron: string },
): schedule.Job {
  const job = schedule.scheduleJob(
    { rule: props.cron, tz: 'Etc/UTC' },
    instrumentJob('tenant-provisioning-recovery', createTenantProvisioningRecoveryJob(props), {
      logger: props.logger,
    }),
  );
  if (!job) {
    throw new Error(`Invalid tenant provisioning recovery schedule: ${props.cron}`);
  }

  props.logger.info(
    `Scheduled tenant provisioning recovery job: ${props.cron} (UTC), stale after ${props.staleAfterMinutes} minutes.`,
    LOG_CONTEXT,
  );
  return job;
}
