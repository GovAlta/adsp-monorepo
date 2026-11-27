import { parseMetricCriteria } from './metricCriteria';

describe('parseMetricCriteria', () => {
  it('reads no bounds when criteria is not set', () => {
    expect(parseMetricCriteria(undefined)).toEqual({ intervalMin: null, intervalMax: null, metricLike: undefined });
  });

  it('reads the interval bounds and metric filter as dates and text', () => {
    const result = parseMetricCriteria(
      '{"intervalMin":"2026-09-01T00:00:00.000Z","intervalMax":"2026-10-01T00:00:00.000Z","metricLike":"response-time"}',
    );

    expect(result.intervalMin).toEqual(new Date('2026-09-01T00:00:00.000Z'));
    expect(result.intervalMax).toEqual(new Date('2026-10-01T00:00:00.000Z'));
    expect(result.metricLike).toBe('response-time');
  });

  it.each([
    ['not-json', 'criteria must be valid JSON.'],
    ['"a string"', 'criteria must be a JSON object.'],
    ['[1,2]', 'criteria must be a JSON object.'],
    ['{"intervalMin":"yesterday"}', 'criteria intervalMin must be an ISO 8601 timestamp.'],
    ['{"intervalMax":true}', 'criteria intervalMax must be an ISO 8601 timestamp.'],
    ['{"metricLike":5}', 'criteria metricLike must be text.'],
  ])('rejects %s as a bad request', (criteria, message) => {
    expect(() => parseMetricCriteria(criteria)).toThrow(message);
    expect(() => parseMetricCriteria(criteria)).toThrow(
      expect.objectContaining({ extra: expect.objectContaining({ statusCode: 400 }) }),
    );
  });
});
