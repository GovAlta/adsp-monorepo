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

// Each pass moves one interval's coverage by at most a chunk, within what its source can supply:
// raw metrics for the finest interval, and the finer interval's own coverage for every other. Both
// windows touch the existing coverage, which is what keeps it a single contiguous span.
//
// Forward and backward are separate because they run under separate locks, and so commit
// separately. Sharing a transaction meant an interval still walking through history rolled its own
// leading edge back whenever a backfill chunk exceeded the statement timeout -- and since the
// backfill only gets slower as it goes, the edge stopped moving for good.

// Keeps the recent buckets current, and seeds the interval if it has never been rolled up.
export const advanceMetricIntervalForward = async (
  repository: MetricIntervalRollupRepository,
  definition: MetricIntervalDefinition,
  available: MetricIntervalWindow,
): Promise<number> => {
  const { interval, bucket, source, seedHours, chunkHours } = definition;
  const coverage = await repository.getCoverage(interval);

  if (!coverage) {
    const start = laterOf(available.start, shiftHours(available.end, -seedHours));
    return repository.refresh(interval, bucket, source, {
      start,
      end: earlierOf(available.end, shiftHours(start, chunkHours)),
    });
  }

  if (coverage.coveredTo >= available.end) {
    return 0;
  }

  return repository.refresh(interval, bucket, source, {
    start: coverage.coveredTo,
    end: earlierOf(available.end, shiftHours(coverage.coveredTo, chunkHours)),
  });
};

// Walks through history a chunk at a time. Seeding belongs to the forward pass, so there is nothing
// to walk back from until that has run.
export const advanceMetricIntervalBackward = async (
  repository: MetricIntervalRollupRepository,
  definition: MetricIntervalDefinition,
  available: MetricIntervalWindow,
): Promise<number> => {
  const { interval, bucket, source, chunkHours } = definition;
  const coverage = await repository.getCoverage(interval);

  if (!coverage || coverage.coveredFrom <= available.start) {
    return 0;
  }

  return repository.refresh(interval, bucket, source, {
    start: laterOf(available.start, shiftHours(coverage.coveredFrom, -chunkHours)),
    end: coverage.coveredFrom,
  });
};

// What an interval is allowed to roll up. The finest reads raw metrics, so it can advance to now;
// every other is bounded by its source's coverage, and cannot start at all until the source has
// some. Definitions run finest first, so a source advanced earlier in the same run is already
// visible here.
export const resolveAvailableWindow = async (
  repository: MetricIntervalRollupRepository,
  definition: MetricIntervalDefinition,
  metricsWindow: MetricIntervalWindow,
  now: Date,
): Promise<MetricIntervalWindow | null> => {
  if (!definition.source) {
    return { start: metricsWindow.start, end: now };
  }

  const coverage = await repository.getCoverage(definition.source);

  return coverage ? { start: coverage.coveredFrom, end: coverage.coveredTo } : null;
};

// Forward first: keeping recent buckets current matters more than reaching further back, and a read
// only benefits from the rollups once they cover the whole window it asks for -- which for anything
// ending at "now" means the leading edge.
const passes: [string, typeof advanceMetricIntervalForward][] = [
  ['forward', advanceMetricIntervalForward],
  ['backward', advanceMetricIntervalBackward],
];

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

    // One transaction per interval per direction, not one for the whole run. Coverage is per
    // interval, so the read-and-extend that has to be atomic is already contained in a single pass;
    // taking the lock once for the run instead meant a statement timeout on any one interval rolled
    // back every interval that had already succeeded, and the job committed nothing at all.
    for (const definition of definitions) {
      for (const [direction, advance] of passes) {
        try {
          const advanced = await repository.withRollupLock(async (locked) => {
            const available = await resolveAvailableWindow(locked, definition, metricsWindow, now);
            if (!available) {
              logger.debug(`No ${definition.source} coverage yet; ${definition.interval} has nothing to build from.`, {
                context: 'MetricIntervalRollup',
              });
              return 0;
            }

            return advance(locked, definition, available);
          });

          if (advanced === null) {
            logger.debug(
              `Another instance holds the ${definition.interval} rollup lock; skipping its ${direction} pass this run.`,
              { context: 'MetricIntervalRollup' },
            );
          } else {
            refreshed += advanced;
          }
        } catch (err) {
          // A pass that cannot finish inside its statement timeout must not stop the rest. The
          // coarse intervals read the most history and so are the ones that time out, and they run
          // last, which would otherwise be indistinguishable from the whole job being broken.
          failed++;
          logger.warn(`Failed to advance the ${definition.interval} metric interval rollup ${direction}. ${err}`, {
            context: 'MetricIntervalRollup',
          });
        }
      }
    }

    logger.info(
      `Refreshed ${refreshed} metric interval rollup record(s)${failed > 0 ? `; ${failed} pass(es) failed` : ''}.`,
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
