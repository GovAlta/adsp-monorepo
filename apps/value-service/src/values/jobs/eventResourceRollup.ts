import { instrumentJob } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { EventResourceRollupRepository } from '../repository';
import { eventResourceRollupSources } from '../serviceMetricRollupMappings';
import { ResourceRollupSource } from '../types';

interface EventResourceRollupJobProps {
  logger: Logger;
  repository: EventResourceRollupRepository;
  maxChunkHours: number;
}

const HOURS_PER_DAY = 24;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR;
// A day is rolled up only this long after it closes, so an event written a moment after midnight
// with a timestamp a moment before it still lands in its day's rollup.
const SETTLE_HOURS = 1;
// A week is one event log chunk; the configured cap still applies, but never below one day.
const PREFERRED_CHUNK_HOURS = 7 * HOURS_PER_DAY;
// Closed days are rolled up again for this long, once an hour, so an event that reaches the log
// after its day settled -- a retry, a delayed write -- is still counted.
const REVISIT_HOURS = 2 * HOURS_PER_DAY;
// The job ticks every five minutes; the revisit runs on the first tick of each hour.
const REVISIT_TICK_MINUTES = 5;

const shiftHours = (date: Date, hours: number): Date => new Date(date.getTime() + hours * MS_PER_HOUR);
const earlierOf = (left: Date, right: Date): Date => (left < right ? left : right);
const laterOf = (left: Date, right: Date): Date => (left > right ? left : right);
const floorUtcDay = (date: Date): Date => new Date(Math.floor(date.getTime() / MS_PER_DAY) * MS_PER_DAY);

export const boundEventResourceChunkHours = (maxChunkHours: number): number =>
  Math.max(HOURS_PER_DAY, Math.min(PREFERRED_CHUNK_HOURS, maxChunkHours));

// Keeps the closed days current, and seeds the source if it has never been rolled up. Once caught up,
// rolls the most recent closed days up again each hour to pick up events that arrived late.
export const advanceEventResourcesForward = async (
  repository: EventResourceRollupRepository,
  source: ResourceRollupSource,
  chunkHours: number,
  now: Date,
): Promise<number> => {
  const end = floorUtcDay(shiftHours(now, -SETTLE_HOURS));
  const coverage = await repository.getCoverage(source);
  const start = coverage ? coverage.coveredTo : shiftHours(end, -chunkHours);

  if (start >= end) {
    if (coverage && now.getUTCMinutes() < REVISIT_TICK_MINUTES) {
      const revisitStart = shiftHours(end, -Math.min(REVISIT_HOURS, chunkHours));
      return repository.refresh(source, { start: laterOf(revisitStart, coverage.coveredFrom), end });
    }
    return 0;
  }

  return repository.refresh(source, { start, end: earlierOf(end, shiftHours(start, chunkHours)) });
};

/**
 * Walks through history a chunk at a time, down to the oldest event log chunk.
 *
 * Each step starts from the newest event log data below coverage rather than from coverage itself,
 * so a span holding no chunks at all -- years between a stray old event and the rest of the log --
 * is crossed in one step instead of a chunk at a time. Reading the empty span costs nothing, since
 * no chunk falls inside it.
 */
export const advanceEventResourcesBackward = async (
  repository: EventResourceRollupRepository,
  source: ResourceRollupSource,
  chunkHours: number,
): Promise<number> => {
  const coverage = await repository.getCoverage(source);
  if (!coverage) {
    return 0;
  }

  const dataEnd = await repository.getEventLogEndBefore(coverage.coveredFrom);
  if (!dataEnd) {
    return 0;
  }

  return repository.refresh(source, {
    start: shiftHours(earlierOf(coverage.coveredFrom, dataEnd), -chunkHours),
    end: coverage.coveredFrom,
  });
};

type Pass = (
  repository: EventResourceRollupRepository,
  source: ResourceRollupSource,
  chunkHours: number,
  now: Date,
) => Promise<number>;

// Forward first, for the same reason as the metric interval rollups: a read only uses the rollup
// for the days it covers, and a report almost always ends at today.
const passes: [string, Pass][] = [
  ['forward', advanceEventResourcesForward],
  ['backward', advanceEventResourcesBackward],
];

export const createEventResourceRollupJob =
  (
    repository: EventResourceRollupRepository,
    logger: Logger,
    chunkHours: number,
    sources: ResourceRollupSource[] = eventResourceRollupSources,
  ) =>
  async (now = new Date()): Promise<number> => {
    let refreshed = 0;
    let failed = 0;

    // One transaction per source per direction, so a backfill step that exceeds its statement
    // timeout rolls back only itself and the leading edge still commits.
    for (const source of sources) {
      for (const [direction, advance] of passes) {
        const label = `${source.namespace} ${source.contextKey}`;
        try {
          const advanced = await repository.withRollupLock((locked) => advance(locked, source, chunkHours, now));

          if (advanced === null) {
            logger.debug(`Another instance holds the event resource rollup lock; skipping ${label} ${direction}.`, {
              context: 'EventResourceRollup',
            });
          } else {
            refreshed += advanced;
          }
        } catch (err) {
          failed++;
          logger.warn(`Failed to advance the ${label} event resource rollup ${direction}. ${err}`, {
            context: 'EventResourceRollup',
          });
        }
      }
    }

    logger.info(
      `Refreshed ${refreshed} event resource rollup record(s)${failed > 0 ? `; ${failed} pass(es) failed` : ''}.`,
      { context: 'EventResourceRollup' },
    );

    return refreshed;
  };

export const scheduleEventResourceRollupJob = ({ logger, repository, maxChunkHours }: EventResourceRollupJobProps): void => {
  const chunkHours = boundEventResourceChunkHours(maxChunkHours);
  const rollupJob = createEventResourceRollupJob(repository, logger, chunkHours);

  // Guards this replica against its own overlapping ticks; the database lock covers the others.
  let running = false;

  // Offset from the metric interval rollup's ticks so the two jobs do not start together.
  schedule.scheduleJob(
    '2-59/5 * * * *',
    instrumentJob(
      'event-resource-rollup',
      async () => {
        if (running) {
          logger.warn('Previous event resource rollup run is still in progress; skipping this run.', {
            context: 'EventResourceRollup',
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
  logger.info(`Scheduled event resource rollup job with a ${chunkHours} hour chunk.`, {
    context: 'EventResourceRollup',
  });
};
