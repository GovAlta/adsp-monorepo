import { instrumentJob } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { MetricIntervalRollupRepository } from '../repository';
import { MetricIntervalDefinition, metricIntervalDefinitions } from '../metricIntervals';
import { MetricIntervalWindow } from '../types';

interface MetricIntervalRollupJobProps {
  logger: Logger;
  repository: MetricIntervalRollupRepository;
}

const MS_PER_HOUR = 60 * 60 * 1000;

const shiftHours = (date: Date, hours: number): Date => new Date(date.getTime() + hours * MS_PER_HOUR);
const earlierOf = (left: Date, right: Date): Date => (left < right ? left : right);
const laterOf = (left: Date, right: Date): Date => (left > right ? left : right);

// Each run moves one interval's coverage by at most a chunk in either direction. Going forward keeps
// recent buckets current, and going backward walks through history a chunk at a time. Both windows
// touch the existing coverage, which is what keeps it a single contiguous span.
export const advanceMetricInterval = async (
  repository: MetricIntervalRollupRepository,
  definition: MetricIntervalDefinition,
  metricsWindow: MetricIntervalWindow,
  now: Date,
): Promise<number> => {
  const { interval, bucket, seedHours, chunkHours } = definition;
  const coverage = await repository.getCoverage(interval);

  if (!coverage) {
    const start = laterOf(metricsWindow.start, shiftHours(now, -seedHours));
    return repository.refresh(interval, bucket, { start, end: earlierOf(now, shiftHours(start, chunkHours)) });
  }

  let refreshed = 0;

  if (coverage.coveredTo < now) {
    refreshed += await repository.refresh(interval, bucket, {
      start: coverage.coveredTo,
      end: earlierOf(now, shiftHours(coverage.coveredTo, chunkHours)),
    });
  }

  if (coverage.coveredFrom > metricsWindow.start) {
    refreshed += await repository.refresh(interval, bucket, {
      start: laterOf(metricsWindow.start, shiftHours(coverage.coveredFrom, -chunkHours)),
      end: coverage.coveredFrom,
    });
  }

  return refreshed;
};

export const createMetricIntervalRollupJob =
  (
    repository: MetricIntervalRollupRepository,
    logger: Logger,
    definitions: MetricIntervalDefinition[] = metricIntervalDefinitions,
  ) =>
  async (now = new Date()): Promise<number> => {
    const metricsWindow = await repository.getMetricsWindow();
    if (!metricsWindow) {
      logger.debug('No metrics recorded yet; skipping metric interval rollup.', { context: 'MetricIntervalRollup' });
      return 0;
    }

    let refreshed = 0;
    for (const definition of definitions) {
      refreshed += await advanceMetricInterval(repository, definition, metricsWindow, now);
    }

    logger.info(`Refreshed ${refreshed} metric interval rollup record(s).`, { context: 'MetricIntervalRollup' });
    return refreshed;
  };

export const scheduleMetricIntervalRollupJob = ({ logger, repository }: MetricIntervalRollupJobProps): void => {
  const rollupJob = createMetricIntervalRollupJob(repository, logger);

  schedule.scheduleJob(
    '*/5 * * * *',
    instrumentJob(
      'metric-interval-rollup',
      async () => {
        await rollupJob();
      },
      { logger },
    ),
  );
  logger.info('Scheduled metric interval rollup job.', { context: 'MetricIntervalRollup' });
};
