import { MetricInterval } from './types';

export interface MetricIntervalDefinition {
  interval: MetricInterval;
  // Postgres interval literal handed to time_bucket.
  bucket: string;
  // How far back coverage starts when an interval is rolled up for the first time.
  seedHours: number;
  // Largest window a single refresh recomputes, so catching up after an outage or walking back
  // through history happens in bounded statements rather than one unbounded scan.
  chunkHours: number;
}

const HOURS_PER_DAY = 24;

export const metricIntervalDefinitions: MetricIntervalDefinition[] = [
  { interval: 'one_minute', bucket: '1 minute', seedHours: HOURS_PER_DAY, chunkHours: HOURS_PER_DAY },
  { interval: 'five_minutes', bucket: '5 minutes', seedHours: 7 * HOURS_PER_DAY, chunkHours: 7 * HOURS_PER_DAY },
  { interval: 'hourly', bucket: '1 hour', seedHours: 30 * HOURS_PER_DAY, chunkHours: 30 * HOURS_PER_DAY },
  { interval: 'daily', bucket: '1 day', seedHours: 365 * HOURS_PER_DAY, chunkHours: 365 * HOURS_PER_DAY },
  { interval: 'weekly', bucket: '1 week', seedHours: 1825 * HOURS_PER_DAY, chunkHours: 1825 * HOURS_PER_DAY },
  { interval: 'monthly', bucket: '1 month', seedHours: 3650 * HOURS_PER_DAY, chunkHours: 3650 * HOURS_PER_DAY },
];

export const getMetricIntervalDefinition = (interval: MetricInterval): MetricIntervalDefinition | undefined =>
  metricIntervalDefinitions.find((definition) => definition.interval === interval);
