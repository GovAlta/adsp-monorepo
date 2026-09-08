import { MetricInterval } from './types';
import { getMetricIntervalDefinition, metricIntervalDefinitions } from './metricIntervals';

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
  it('gives coarser intervals wider windows than finer ones', () => {
    const chunks = metricIntervalDefinitions.map((definition) => definition.chunkHours);
    expect(chunks).toEqual([...chunks].sort((left, right) => left - right));
  });
});

describe('getMetricIntervalDefinition', () => {
  it('finds the definition for a known interval', () => {
    expect(getMetricIntervalDefinition('hourly')).toEqual({
      interval: 'hourly',
      bucket: '1 hour',
      seedHours: 720,
      chunkHours: 720,
    });
  });

  it('returns undefined for an unknown interval', () => {
    expect(getMetricIntervalDefinition('yearly' as MetricInterval)).toBeUndefined();
  });
});
