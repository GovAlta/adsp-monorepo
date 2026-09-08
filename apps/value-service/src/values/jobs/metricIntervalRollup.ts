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
    const metricsWindow = await repository.getMetricsWindow();
    if (!metricsWindow) {
      logger.debug('No metrics recorded yet; skipping metric interval rollup.', { context: 'MetricIntervalRollup' });
      return 0;
    }

    let refreshed = 0;
    let failed = 0;

    // One transaction per interval, not one for the whole run. Coverage is per interval, so the
    // read-and-extend that has to be atomic is already contained here; taking the lock once for the
    // run instead meant a statement timeout on any one interval rolled back every interval that had
    // already succeeded, and the job committed nothing at all.
    for (const definition of definitions) {
      try {
        const advanced = await repository.withRollupLock((locked) =>
          advanceMetricInterval(locked, definition, metricsWindow, now),
        );

        if (advanced === null) {
          logger.debug(`Another instance holds the ${definition.interval} rollup lock; skipping it this run.`, {
            context: 'MetricIntervalRollup',
          });
        } else {
          refreshed += advanced;
        }
      } catch (err) {
        // An interval that cannot finish inside its statement timeout must not stop the rest. The
        // coarse intervals read the most history and so are the ones that time out, and they run
        // last, which would otherwise be indistinguishable from the whole job being broken.
        failed++;
        logger.warn(`Failed to advance the ${definition.interval} metric interval rollup. ${err}`, {
          context: 'MetricIntervalRollup',
        });
      }
    }

    logger.info(
      `Refreshed ${refreshed} metric interval rollup record(s)${failed > 0 ? `; ${failed} interval(s) failed` : ''}.`,
      { context: 'MetricIntervalRollup' },
    );

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
