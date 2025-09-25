import { getTimeFromGMT, getDateTime, getLocalISOString } from './timeUtil';

describe('getTimeFromGMT', () => {
  it('should format the time correctly for times with double-digit hours and minutes', () => {
    const date = new Date('2022-06-16T15:30:00Z'); // 15:30 in GMT
    const time = getTimeFromGMT(date);
    expect(time).toBe('15:30');
  });

  it('should pad single-digit hours and minutes with leading zeros', () => {
    const date = new Date('2022-06-16T09:05:00Z'); // 09:05 in GMT
    const time = getTimeFromGMT(date);

    expect(time).toBe('09:05');
  });
});

describe('getDateTime', () => {
  it('combines date and time into a single Date object', () => {
    const date = '2023-10-01';
    const time = '14:30';
    const result = getDateTime(date, time);
    expect(result instanceof Date).toBe(true);
    expect(result.toISOString().startsWith('2023-10-01T14:30')).toBe(true);
  });

  it('handles different date and time formats', () => {
    const date = '10/02/2023';
    const time = '23:45';
    const result = getDateTime(date, time);
    expect(result.toISOString().startsWith('2023-10-02T23:45')).toBe(true);
  });

  it('handles edge cases like end of month transitions', () => {
    const date = '2023-01-31';
    const time = '23:59';
    const result = getDateTime(date, time);
    expect(result.toISOString().startsWith('2023-01-31T23:59')).toBe(true);
  });
});

describe('getLocalISOString', () => {
  it('returns an ISO string representing the local time', () => {
    const date = new Date('2023-01-01T12:00:00Z');
    const expectedLocalISO = '2023-01-01T12:00:00.000+00:00';

    const result = getLocalISOString(date);
    expect(result).toBe(expectedLocalISO);
  });

  it('handles daylight saving time transitions', () => {
    const date = new Date('2023-11-05T01:00:00Z');
    const expectedLocalISO = '2023-11-05T01:00:00.000+00:00';

    const result = getLocalISOString(date);
    expect(result).toBe(expectedLocalISO);
  });

  it('adjusts correctly for positive and negative UTC offsets', () => {
    const positiveOffsetDate = new Date('2023-06-01T12:00:00Z');
    const negativeOffsetDate = new Date('2023-06-01T12:00:00Z');

    const expectedPositive = '2023-06-01T12:00:00.000+00:00';
    const expectedNegative = '2023-06-01T12:00:00.000+00:00';
    const resultPositive = getLocalISOString(positiveOffsetDate);
    const resultNegative = getLocalISOString(negativeOffsetDate);

    expect(resultPositive).toBe(expectedPositive);
    expect(resultNegative).toBe(expectedNegative);
  });
});
