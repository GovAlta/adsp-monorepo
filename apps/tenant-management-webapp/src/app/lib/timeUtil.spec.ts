import { getTimeFromGMT, getDateTime, getLocalISOString, parseLocalDate, toDateInputValue } from './timeUtil';

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

describe('date only handling', () => {
  // Tests run with TZ=UTC (jest.preset.js), so these pin down the local time semantics the browser relies on:
  // a date only string is the day the user picked, not that day at UTC midnight.
  it('parses a date only string as local midnight rather than UTC midnight', () => {
    const parsed = parseLocalDate('2026-08-20');
    const offsetMs = parsed.getTimezoneOffset() * 60000;

    expect(parsed.getTime()).toBe(Date.parse('2026-08-20T00:00:00.000Z') + offsetMs);
    expect(parsed.getDate()).toBe(20);
    expect(parsed.getHours()).toBe(0);
  });

  it('parses other date formats the way the Date constructor does', () => {
    expect(parseLocalDate('10/02/2023').getDate()).toBe(2);
    expect(isNaN(parseLocalDate('not a date').getTime())).toBe(true);
  });

  it('returns the date it is given', () => {
    const date = new Date(2026, 7, 20, 20, 0);

    expect(parseLocalDate(date)).toBe(date);
  });

  it('formats a date input value from the local date', () => {
    expect(toDateInputValue(new Date(2026, 7, 20, 20, 0))).toBe('2026-08-20');
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateInputValue(new Date('not a date'))).toBe('');
  });

  it('combines a date only string with a local time', () => {
    const result = getDateTime('2026-08-20', '00:00');

    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('keeps the entered day through a date input round trip', () => {
    const result = getDateTime(parseLocalDate('2026-08-20'), '12:30:45');

    expect(toDateInputValue(result)).toBe('2026-08-20');
    expect(result.getHours()).toBe(12);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(45);
  });

  // A date input reports every keystroke in the year, so typing 2020 arrives as 0002, 0020, 0202 and
  // then 2020. Each of those has to survive the round trip, or the value written back to the input
  // replaces what the user is typing.
  it('keeps a year in the first two centuries out of the 1900s', () => {
    expect(parseLocalDate('0020-08-20').getFullYear()).toBe(20);
    expect(parseLocalDate('0002-08-20').getFullYear()).toBe(2);
    expect(parseLocalDate('0202-08-20').getFullYear()).toBe(202);
  });

  it('pads a short year to the four digits a date input needs', () => {
    expect(toDateInputValue(parseLocalDate('0020-08-20'))).toBe('0020-08-20');
    expect(toDateInputValue(parseLocalDate('0002-08-20'))).toBe('0002-08-20');
    expect(toDateInputValue(parseLocalDate('0202-08-20'))).toBe('0202-08-20');
  });

  it('round trips each year a date input reports while 2020 is typed', () => {
    ['0002-08-20', '0020-08-20', '0202-08-20', '2020-08-20'].forEach((entered) => {
      expect(toDateInputValue(parseLocalDate(entered))).toBe(entered);
    });
  });

  it('keeps a short year when the date is combined with a time', () => {
    const result = getDateTime('0020-08-20', '12:30');

    expect(result.getFullYear()).toBe(20);
    expect(toDateInputValue(result)).toBe('0020-08-20');
  });
});
