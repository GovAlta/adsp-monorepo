import { AdspId, ServiceDirectory, TenantService, TokenProvider, instrumentJob } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { createCollectMetricsJob } from './metrics';
import { MetricsRepository } from '../repository';

export interface MetricsServiceWorkItem {
  work: 'aggregate' | 'cleanup' | 'unknown';
  metricId: string;
  timestamp: Date;
  tenantId: AdspId;
}

interface MetricsJobProps {
  logger: Logger;
  directory: ServiceDirectory;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
  repository: MetricsRepository;
}

export const createMetricsJobs = ({
  logger,
  directory,
  tenantService,
  tokenProvider,
  repository,
}: MetricsJobProps): void => {
  const collectMetricsJob = instrumentJob(
    'collect-metrics',
    createCollectMetricsJob(logger, directory, tenantService, tokenProvider, repository),
    { logger }
  );

  // Schedule collect metrics job (e.g., daily at midnight)
  schedule.scheduleJob('0 0 * * *', collectMetricsJob);

  // Run once on startup.
  collectMetricsJob();

  logger.info('Scheduled metrics jobs: collect.', { context: 'createMetricsJobs' });
};
