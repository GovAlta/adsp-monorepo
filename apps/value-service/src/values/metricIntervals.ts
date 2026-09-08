import { MetricInterval } from './types';

export interface MetricIntervalDefinition {
  interval: MetricInterval;
  // Postgres interval literal handed to time_bucket.
  bucket: string;
  // Span of a single bucket. A chunk narrower than this re-reads the same bucket on every run
  // without ever advancing past it, so it is the floor the configured cap cannot cut below.
  bucketHours: number;
  // How far back coverage starts when an interval is rolled up for the first time.
  seedHours: number;
  // Largest window a single refresh recomputes, so catching up after an outage or walking back
  // through history happens in bounded statements rather than one unbounded scan.
  chunkHours: number;
}

const HOURS_PER_DAY = 24;
const MINUTE_HOURS = 1 / 60;

// A refresh aggregates the raw metrics table over its window, so what a run costs follows the span
// of that window rather than the width of the bucket being filled: a month of raw metrics is the
// same read whether it lands in daily buckets or one monthly bucket. Chunks are therefore whole
// numbers of buckets sized to a bounded span, and history fills in over successive runs.
export const metricIntervalDefinitions: MetricIntervalDefinition[] = [
  {
    interval: 'one_minute',
    bucket: '1 minute',
    bucketHours: MINUTE_HOURS,
    seedHours: HOURS_PER_DAY,
    chunkHours: HOURS_PER_DAY,
  },
  {
    interval: 'five_minutes',
    bucket: '5 minutes',
    bucketHours: 5 * MINUTE_HOURS,
    seedHours: 7 * HOURS_PER_DAY,
    chunkHours: 7 * HOURS_PER_DAY,
  },
  {
    interval: 'hourly',
    bucket: '1 hour',
    bucketHours: 1,
    seedHours: 30 * HOURS_PER_DAY,
    chunkHours: 30 * HOURS_PER_DAY,
  },
  {
    interval: 'daily',
    bucket: '1 day',
    bucketHours: HOURS_PER_DAY,
    seedHours: 30 * HOURS_PER_DAY,
    chunkHours: 30 * HOURS_PER_DAY,
  },
  {
    interval: 'weekly',
    bucket: '1 week',
    bucketHours: 7 * HOURS_PER_DAY,
    seedHours: 28 * HOURS_PER_DAY,
    chunkHours: 28 * HOURS_PER_DAY,
  },
  {
    interval: 'monthly',
    bucket: '1 month',
    bucketHours: 31 * HOURS_PER_DAY,
    seedHours: 31 * HOURS_PER_DAY,
    chunkHours: 31 * HOURS_PER_DAY,
  },
];

/**
 * Bound a definition's windows to what one statement is allowed to read.
 *
 * The cap is deployment configuration rather than a constant because how much raw history the
 * database can absorb in a single statement depends on how much of it there is. It cannot cut
 * below one bucket: a window narrower than the bucket it fills leaves coverage where it was, and
 * the interval would never finish backfilling.
 */
export const boundMetricIntervalDefinition = (
  definition: MetricIntervalDefinition,
  maxChunkHours: number,
): MetricIntervalDefinition => {
  const bound = (hours: number) => Math.max(definition.bucketHours, Math.min(hours, maxChunkHours));

  return { ...definition, seedHours: bound(definition.seedHours), chunkHours: bound(definition.chunkHours) };
};

export const boundMetricIntervalDefinitions = (
  maxChunkHours: number,
  definitions: MetricIntervalDefinition[] = metricIntervalDefinitions,
): MetricIntervalDefinition[] =>
  definitions.map((definition) => boundMetricIntervalDefinition(definition, maxChunkHours));

export const getMetricIntervalDefinition = (interval: MetricInterval): MetricIntervalDefinition | undefined =>
  metricIntervalDefinitions.find((definition) => definition.interval === interval);
