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

  // A composed interval's upsert still writes one row per bucket per distinct series, so a wide
  // window can exhaust the database's shared lock table even though the SELECT behind it is cheap;
  // the cap applies to it too, down to no less than one of its own (much wider) buckets.
  it('caps a composed interval at the configured maximum', () => {
    expect(boundMetricIntervalDefinition(monthly, 24 * 60)).toEqual({
      ...monthly,
      seedHours: 24 * 60,
      chunkHours: 24 * 60,
    });
  });

  it('will not cut a composed interval below one of its own buckets', () => {
    const bounded = boundMetricIntervalDefinition(monthly, 1);

    expect(bounded.chunkHours).toBe(monthly.bucketHours);
    expect(bounded.seedHours).toBe(monthly.bucketHours);
  });

  it('bounds every definition', () => {
    const bounded = boundMetricIntervalDefinitions(6);

    expect(bounded.find(({ interval }) => interval === 'one_minute').chunkHours).toBe(6);
    // one_minute's own bucket is under an hour, so it takes the 6-hour cap as given; daily's bucket
    // is 24 hours, wider than the cap, so it floors at its own bucket instead.
    expect(bounded.find(({ interval }) => interval === 'daily').chunkHours).toBe(
      getMetricIntervalDefinition('daily').bucketHours,
    );
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
