import { instrumentJob } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { MetricIntervalRollupRepository } from '../repository';
import { boundMetricIntervalDefinitions, MetricIntervalDefinition } from '../metricIntervals';
import { MetricIntervalWindow } from '../types';

interface MetricIntervalRollupJobProps {
  logger: Logger;
  repository: MetricIntervalRollupRepository;
  maxChunkHours: number;
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
    definitions: MetricIntervalDefinition[] = boundMetricIntervalDefinitions(Number.POSITIVE_INFINITY),
  ) =>
  async (now = new Date()): Promise<number> => {
    // The whole run goes under the lock rather than each interval separately: coverage is read and
    // then extended from what was read, so two runs interleaving between those two steps would each
    // advance from the same edge and leave a window neither of them filled.
    const refreshed = await repository.withRollupLock(async (locked) => {
      const metricsWindow = await locked.getMetricsWindow();
      if (!metricsWindow) {
        logger.debug('No metrics recorded yet; skipping metric interval rollup.', { context: 'MetricIntervalRollup' });
        return 0;
      }

      let total = 0;
      for (const definition of definitions) {
        total += await advanceMetricInterval(locked, definition, metricsWindow, now);
      }

      logger.info(`Refreshed ${total} metric interval rollup record(s).`, { context: 'MetricIntervalRollup' });
      return total;
    });

    if (refreshed === null) {
      logger.debug('Another instance holds the metric interval rollup lock; skipping this run.', {
        context: 'MetricIntervalRollup',
      });
      return 0;
    }

    return refreshed;
  };

export const scheduleMetricIntervalRollupJob = ({
  logger,
  repository,
  maxChunkHours,
}: MetricIntervalRollupJobProps): void => {
  const definitions = boundMetricIntervalDefinitions(maxChunkHours);
  const rollupJob = createMetricIntervalRollupJob(repository, logger, definitions);

  // node-schedule fires on the tick whether or not the previous run finished, so a run that outlives
  // its interval would have the next one start on top of it and the pile-up would hold a connection
  // each. The database lock already excludes other replicas; this excludes this one from itself,
  // without waiting on a round trip to find that out.
  let running = false;

  schedule.scheduleJob(
    '*/5 * * * *',
    instrumentJob(
      'metric-interval-rollup',
      async () => {
        if (running) {
          logger.warn('Previous metric interval rollup run is still in progress; skipping this run.', {
            context: 'MetricIntervalRollup',
          });
          return;
        }

        running = true;
        try {
          await rollupJob();
        } finally {
          running = false;
        }
      },
      { logger },
    ),
  );
  logger.info(`Scheduled metric interval rollup job with a ${maxChunkHours} hour chunk cap.`, {
    context: 'MetricIntervalRollup',
  });
};
