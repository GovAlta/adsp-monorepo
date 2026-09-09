import { MetricInterval } from './types';

export interface MetricIntervalDefinition {
  interval: MetricInterval;
  // Postgres interval literal handed to time_bucket.
  bucket: string;
  // Interval whose buckets this one is aggregated from, or null to read the raw metrics table.
  source: MetricInterval | null;
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

/**
 * Each interval is aggregated from the next finer one, and only the finest reads raw metrics.
 *
 * sum, count, min and max all compose -- a month's sum is the sum of its days' sums, its min the
 * least of their mins -- which is why the rollups store those four and derive the average on read
 * rather than storing it. An average of averages would not compose, and this is what the schema
 * was shaped for.
 *
 * So a monthly bucket reads about thirty daily rows instead of a month of raw metrics, and what a
 * refresh costs stops following the width of the bucket it fills. Only one_minute pays for a raw
 * scan, which is why it alone keeps a tight window.
 *
 * Both weekly and monthly compose from daily rather than chaining monthly off weekly: a week can
 * straddle a month boundary, so weeks do not nest inside months and a month built from weeks would
 * draw in days either side of it.
 */
export const metricIntervalDefinitions: MetricIntervalDefinition[] = [
  {
    interval: 'one_minute',
    bucket: '1 minute',
    source: null,
    bucketHours: MINUTE_HOURS,
    seedHours: HOURS_PER_DAY,
    chunkHours: HOURS_PER_DAY,
  },
  {
    interval: 'five_minutes',
    bucket: '5 minutes',
    source: 'one_minute',
    bucketHours: 5 * MINUTE_HOURS,
    seedHours: 7 * HOURS_PER_DAY,
    chunkHours: 7 * HOURS_PER_DAY,
  },
  {
    interval: 'hourly',
    bucket: '1 hour',
    source: 'five_minutes',
    bucketHours: 1,
    seedHours: 30 * HOURS_PER_DAY,
    chunkHours: 30 * HOURS_PER_DAY,
  },
  {
    interval: 'daily',
    bucket: '1 day',
    source: 'hourly',
    bucketHours: HOURS_PER_DAY,
    seedHours: 90 * HOURS_PER_DAY,
    chunkHours: 90 * HOURS_PER_DAY,
  },
  {
    interval: 'weekly',
    bucket: '1 week',
    source: 'daily',
    bucketHours: 7 * HOURS_PER_DAY,
    seedHours: 365 * HOURS_PER_DAY,
    chunkHours: 365 * HOURS_PER_DAY,
  },
  {
    interval: 'monthly',
    bucket: '1 month',
    source: 'daily',
    bucketHours: 31 * HOURS_PER_DAY,
    seedHours: 730 * HOURS_PER_DAY,
    chunkHours: 730 * HOURS_PER_DAY,
  },
];

/**
 * Bound a definition's windows to what one statement is allowed to read.
 *
 * The cap applies only to an interval that reads raw metrics, where the cost follows the span of
 * the window. An interval composed from a finer one reads a bounded number of rollup rows per
 * bucket however wide its window is, so capping it would only slow the backfill down for nothing.
 *
 * It cannot cut below one bucket either: a window narrower than the bucket it fills leaves coverage
 * where it was, and the interval would never finish backfilling.
 */
export const boundMetricIntervalDefinition = (
  definition: MetricIntervalDefinition,
  maxChunkHours: number,
): MetricIntervalDefinition => {
  if (definition.source) {
    return definition;
  }

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
