import { instrumentJob } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { ServiceMetricRollupMapping } from '../types';
import { ServiceMetricRollupRepository } from '../repository';
import { serviceMetricRollupMappings } from '../serviceMetricRollupMappings';

interface ServiceMetricRollupJobProps {
  logger: Logger;
  repository: ServiceMetricRollupRepository;
  trailingDays: number;
  backfillOnStartup: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const createServiceMetricRollupJob =
  (
    repository: ServiceMetricRollupRepository,
    logger: Logger,
    mappings: ServiceMetricRollupMapping[] = serviceMetricRollupMappings
  ) =>
  async (range = getTrailingCompletedDayRange(3)): Promise<number> => {
    const knownTenantServices = await repository.getKnownTenantServices(mappings);

    if (knownTenantServices.length === 0) {
      logger.info('No known tenant services found for service metric rollups.');
      return 0;
    }

    const rollups = [];
    for (const day of getDays(range.start, range.end)) {
      for (const { tenant, service } of knownTenantServices) {
        const mapping = mappings.find((candidate) => candidate.service === service);
        if (mapping) {
          rollups.push(await repository.readRollup(day, tenant, mapping));
        }
      }
    }

    await repository.upsertRollups(rollups);
    logger.info(`Stored ${rollups.length} service metric rollup record(s).`);
    return rollups.length;
  };

export const scheduleServiceMetricRollupJob = async ({
  logger,
  repository,
  trailingDays,
  backfillOnStartup,
}: ServiceMetricRollupJobProps): Promise<void> => {
  const rollupJob = createServiceMetricRollupJob(repository, logger);

  if (backfillOnStartup && !(await repository.hasRollups())) {
    const historicalRange = await repository.getHistoricalRollupRange(serviceMetricRollupMappings);
    if (historicalRange) {
      await instrumentJob(
        'service-metric-rollup-backfill',
        async () => {
          await rollupJob(historicalRange);
        },
        { logger }
      )();
    }
  }

  schedule.scheduleJob(
    '0 2 * * *',
    instrumentJob(
      'service-metric-rollup',
      async () => {
        await rollupJob(getTrailingCompletedDayRange(trailingDays));
      },
      { logger }
    )
  );
  logger.info('Scheduled daily service metric rollup job.');
};

export function getTrailingCompletedDayRange(trailingDays: number, now = new Date()): { start: Date; end: Date } {
  const completedYesterday = startOfUtcDay(new Date(now.getTime() - MS_PER_DAY));
  const start = new Date(completedYesterday);
  start.setUTCDate(start.getUTCDate() - Math.max(trailingDays - 1, 0));

  return {
    start,
    end: completedYesterday,
  };
}

export function getDays(start: Date, end: Date): Date[] {
  const days = [];
  for (let day = startOfUtcDay(start); day <= end; day = new Date(day.getTime() + MS_PER_DAY)) {
    days.push(day);
  }

  return days;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
