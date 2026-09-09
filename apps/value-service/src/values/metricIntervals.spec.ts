import { MetricInterval } from './types';
import {
  boundMetricIntervalDefinition,
  boundMetricIntervalDefinitions,
  getMetricIntervalDefinition,
  metricIntervalDefinitions,
} from './metricIntervals';

const allIntervals: MetricInterval[] = ['one_minute', 'five_minutes', 'hourly', 'daily', 'weekly', 'monthly'];

describe('metricIntervalDefinitions', () => {
  it('defines every interval the metric API accepts', () => {
    expect(metricIntervalDefinitions.map((definition) => definition.interval)).toEqual(allIntervals);
  });

  it('gives every interval a bounded seed and chunk', () => {
    metricIntervalDefinitions.forEach(({ seedHours, chunkHours }) => {
      expect(seedHours).toBeGreaterThan(0);
      expect(chunkHours).toBeGreaterThan(0);
    });
  });

  // A chunk narrower than a bucket could never advance coverage past that bucket.
  it('gives every interval a chunk at least one bucket wide', () => {
    metricIntervalDefinitions.forEach(({ bucketHours, seedHours, chunkHours }) => {
      expect(chunkHours).toBeGreaterThanOrEqual(bucketHours);
      expect(seedHours).toBeGreaterThanOrEqual(bucketHours);
    });
  });

  // Only the finest interval pays for a raw scan; every other reads a bounded number of rollup rows
  // per bucket, which is what stops a coarse bucket costing a month of metrics to fill.
  it('reads raw metrics for the finest interval only', () => {
    const raw = metricIntervalDefinitions.filter(({ source }) => !source);

    expect(raw.map(({ interval }) => interval)).toEqual(['one_minute']);
    expect(raw[0].chunkHours).toBeLessThanOrEqual(24);
  });

  // A source has to be advanced before anything built on it, and the job walks the list in order.
  it('lists every interval after the one it composes from', () => {
    const seen: MetricInterval[] = [];

    metricIntervalDefinitions.forEach(({ interval, source }) => {
      if (source) {
        expect(seen).toContain(source);
      }
      seen.push(interval);
    });
  });

  // A week can straddle a month boundary, so weeks do not nest inside months; a month built from
  // weeks would pull in days either side of it.
  it('composes both weekly and monthly from daily rather than chaining them', () => {
    expect(getMetricIntervalDefinition('weekly').source).toBe('daily');
    expect(getMetricIntervalDefinition('monthly').source).toBe('daily');
  });
});

describe('boundMetricIntervalDefinition', () => {
  const oneMinute = getMetricIntervalDefinition('one_minute');
  const monthly = getMetricIntervalDefinition('monthly');

  it('caps both windows of a raw-reading interval at the configured maximum', () => {
    expect(boundMetricIntervalDefinition(oneMinute, 6)).toEqual({ ...oneMinute, seedHours: 6, chunkHours: 6 });
  });

  it('leaves a raw-reading definition already inside the cap alone', () => {
    expect(boundMetricIntervalDefinition(oneMinute, 10000)).toEqual(oneMinute);
  });

  // Cutting below a bucket would leave the refresh recomputing the same bucket forever.
  it('will not cut a raw-reading window below one bucket', () => {
    const bounded = boundMetricIntervalDefinition(oneMinute, 0);

    expect(bounded.chunkHours).toBe(oneMinute.bucketHours);
    expect(bounded.seedHours).toBe(oneMinute.bucketHours);
  });

  // A composed interval reads rollup rows, not a span of raw metrics, so the cap has nothing to
  // bound and applying it would only slow the backfill down.
  it('leaves a composed interval uncapped', () => {
    expect(boundMetricIntervalDefinition(monthly, 1)).toEqual(monthly);
  });

  it('bounds every definition', () => {
    const bounded = boundMetricIntervalDefinitions(6);

    expect(bounded.find(({ interval }) => interval === 'one_minute').chunkHours).toBe(6);
    expect(bounded.find(({ interval }) => interval === 'daily')).toEqual(getMetricIntervalDefinition('daily'));
  });
});

describe('getMetricIntervalDefinition', () => {
  it('finds the definition for a known interval', () => {
    expect(getMetricIntervalDefinition('hourly')).toEqual({
      interval: 'hourly',
      bucket: '1 hour',
      source: 'five_minutes',
      bucketHours: 1,
      seedHours: 720,
      chunkHours: 720,
    });
  });

  it('returns undefined for an unknown interval', () => {
    expect(getMetricIntervalDefinition('yearly' as MetricInterval)).toBeUndefined();
  });
});
