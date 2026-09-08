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

  // What a refresh costs follows the span it reads out of metrics, not the bucket it fills, so a
  // coarse interval must not be given a wider window just because its buckets are wider.
  it('keeps every window within a couple of months of raw metrics', () => {
    metricIntervalDefinitions.forEach(({ seedHours, chunkHours }) => {
      expect(chunkHours).toBeLessThanOrEqual(62 * 24);
      expect(seedHours).toBeLessThanOrEqual(62 * 24);
    });
  });
});

describe('boundMetricIntervalDefinition', () => {
  const hourly = getMetricIntervalDefinition('hourly');
  const monthly = getMetricIntervalDefinition('monthly');

  it('caps both windows at the configured maximum', () => {
    expect(boundMetricIntervalDefinition(hourly, 48)).toEqual({ ...hourly, seedHours: 48, chunkHours: 48 });
  });

  it('leaves a definition already inside the cap alone', () => {
    expect(boundMetricIntervalDefinition(hourly, 10000)).toEqual(hourly);
  });

  // Cutting below a bucket would leave the refresh recomputing the same bucket forever, so the
  // interval would never finish walking back through history.
  it('will not cut a window below one bucket', () => {
    const bounded = boundMetricIntervalDefinition(monthly, 1);

    expect(bounded.chunkHours).toBe(monthly.bucketHours);
    expect(bounded.seedHours).toBe(monthly.bucketHours);
  });

  it('bounds every definition', () => {
    boundMetricIntervalDefinitions(48).forEach(({ bucketHours, chunkHours }) => {
      expect(chunkHours).toBe(Math.max(bucketHours, Math.min(chunkHours, 48)));
    });
  });
});

describe('getMetricIntervalDefinition', () => {
  it('finds the definition for a known interval', () => {
    expect(getMetricIntervalDefinition('hourly')).toEqual({
      interval: 'hourly',
      bucket: '1 hour',
      bucketHours: 1,
      seedHours: 720,
      chunkHours: 720,
    });
  });

  it('returns undefined for an unknown interval', () => {
    expect(getMetricIntervalDefinition('yearly' as MetricInterval)).toBeUndefined();
  });
});
