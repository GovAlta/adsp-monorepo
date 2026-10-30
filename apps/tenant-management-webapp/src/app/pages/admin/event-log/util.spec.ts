import {
  dateRangeCriteria,
  defaultEventLogCriteria,
  fromDateTimeLocalValue,
  getDateRangeLabel,
  getDateRangePreset,
  isValidDateRange,
  toDateTimeLocalValue,
} from './util';

describe('event log date ranges', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-19T18:30:45.123Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('defaults to an exact seven-day UTC interval ending now', () => {
    const criteria = defaultEventLogCriteria();

    expect(criteria).toEqual({
      namespace: '',
      name: '',
      timestampMin: '2026-10-12T18:30:45.123Z',
      timestampMax: '2026-10-19T18:30:45.123Z',
    });
  });

  it.each([
    ['last-hour', '2026-10-19T17:30:45.123Z'],
    ['today', '2026-10-19T06:00:00.000Z'],
    ['last-24-hours', '2026-10-18T18:30:45.123Z'],
    ['last-7-days', '2026-10-12T18:30:45.123Z'],
    ['last-30-days', '2026-09-19T18:30:45.123Z'],
  ] as const)('resolves %s to exact UTC boundaries ending now', (preset, start) => {
    const criteria = dateRangeCriteria(preset);

    expect(criteria).toEqual({
      namespace: '',
      name: '',
      timestampMin: start,
      timestampMax: '2026-10-19T18:30:45.123Z',
    });
  });

  it.each([
    ['2026-01-02T02:00:00Z', '2026-01-01T07:00:00.000Z'],
    ['2026-07-02T02:00:00Z', '2026-07-01T06:00:00.000Z'],
    ['2026-03-08T18:00:00Z', '2026-03-08T07:00:00.000Z'],
    ['2026-11-01T19:00:00Z', '2026-11-01T06:00:00.000Z'],
  ])('starts Today at Mountain midnight for %s, including daylight saving changes', (now, midnight) => {
    jest.setSystemTime(new Date(now));

    const criteria = dateRangeCriteria('today');

    expect(criteria.timestampMin).toBe(midnight);
    expect(criteria.timestampMax).toBe(new Date(now).toISOString());
  });

  it.each([
    ['last-hour', 1],
    ['last-24-hours', 24],
    ['last-7-days', 168],
    ['last-30-days', 720],
  ] as const)('uses an elapsed duration for %s across daylight saving changes', (preset, hours) => {
    const now = new Date('2026-11-01T19:00:00Z');

    const criteria = dateRangeCriteria(preset, now);

    expect(now.getTime() - new Date(criteria.timestampMin).getTime()).toBe(hours * 60 * 60 * 1000);
  });

  it.each([
    ['2026-01-02T19:30:00Z', '2026-01-02T12:30'],
    ['2026-07-02T18:30:00Z', '2026-07-02T12:30'],
  ])('formats %s as a Mountain Time input', (timestamp, expected) => {
    const value = toDateTimeLocalValue(new Date(timestamp));

    expect(value).toBe(expected);
  });

  it.each([
    ['2026-01-02T12:30', '2026-01-02T19:30:00.000Z'],
    ['2026-07-02T12:30', '2026-07-02T18:30:00.000Z'],
  ])('converts custom Mountain Time %s to UTC', (value, expected) => {
    const timestamp = fromDateTimeLocalValue(value);

    expect(timestamp).toBe(expected);
  });

  it.each(['', 'invalid-date', '2026-03-08T02:30'])('rejects invalid or nonexistent custom time %s', (value) => {
    const timestamp = fromDateTimeLocalValue(value);

    expect(timestamp).toBe('');
  });

  it.each(['last-hour', 'today', 'last-24-hours', 'last-7-days', 'last-30-days'] as const)(
    'recognizes an applied %s range after time has passed',
    (preset) => {
      const criteria = dateRangeCriteria(preset);
      jest.setSystemTime(new Date('2026-10-20T20:00:00Z'));

      const actual = getDateRangePreset(criteria);

      expect(actual).toBe(preset);
    },
  );

  it('labels an applied Today range after time has passed', () => {
    const criteria = dateRangeCriteria('today');
    jest.setSystemTime(new Date('2026-10-20T20:00:00Z'));

    const label = getDateRangeLabel(criteria);

    expect(label).toBe('Today');
  });

  it.each([
    {},
    { timestampMin: '2026-01-02T12:00:00Z' },
    { timestampMin: 'invalid', timestampMax: '2026-01-02T12:00:00Z' },
    { timestampMin: '2026-01-02T12:00:00Z', timestampMax: 'invalid' },
    { timestampMin: '2026-01-02T12:00:00Z', timestampMax: '2026-01-02T12:00:00Z' },
    { timestampMin: '2026-01-02T12:00:00Z', timestampMax: '2026-01-02T11:00:00Z' },
  ])('rejects missing, invalid, equal, or reversed boundaries: %j', (criteria) => {
    const valid = isValidDateRange(criteria);

    expect(valid).toBe(false);
  });

  it('accepts a strictly increasing range', () => {
    const criteria = { timestampMin: '2026-01-02T12:00:00Z', timestampMax: '2026-01-02T12:01:00Z' };

    const valid = isValidDateRange(criteria);

    expect(valid).toBe(true);
  });

  it('does not label an empty date constraint', () => {
    const label = getDateRangeLabel({ timestampMin: '', timestampMax: '' });

    expect(label).toBe('');
  });
});
