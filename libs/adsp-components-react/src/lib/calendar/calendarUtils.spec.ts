import { getDefaultDateRange, hasTimePart, toLocalDateTime } from './calendarUtils';
import { DEFAULT_RANGE_DAYS } from './types';

describe('calendarUtils', () => {
  describe('toLocalDateTime', () => {
    test.each([
      ['summer (MDT)', '2026-07-15T18:30:15.123Z', '2026-07-15T12:30:15.123-06:00'],
      ['winter (MST)', '2026-01-15T18:30:15.123Z', '2026-01-15T11:30:15.123-07:00'],
    ])('formats an instant in the Alberta time zone during %s', (_season, instant, expected) => {
      // Arrange
      const date = new Date(instant);

      // Act
      const result = toLocalDateTime(date);

      // Assert
      expect(result).toBe(expected);
    });

    test('formats the start of an Alberta day with a zero hour', () => {
      // Arrange
      const date = new Date('2026-07-15T06:00:00.000Z');

      // Act
      const result = toLocalDateTime(date);

      // Assert
      expect(result).toBe('2026-07-15T00:00:00.000-06:00');
    });

    test('uses the Alberta calendar day when it differs from the UTC day', () => {
      // Arrange
      const date = new Date('2026-07-16T03:00:00.000Z');

      // Act
      const result = toLocalDateTime(date);

      // Assert
      expect(result).toBe('2026-07-15T21:00:00.000-06:00');
    });
  });

  describe('hasTimePart', () => {
    test.each([
      ['undefined', undefined],
      ['an empty string', ''],
      ['a date-only string', '2026-05-10'],
      ['an unparsable string', 'not-a-date'],
    ])('returns false for %s', (_description, value) => {
      // Act
      const result = hasTimePart(value);

      // Assert
      expect(result).toBe(false);
    });

    test.each([
      ['local midnight', '2026-05-10T00:00:00'],
      ['11:59 PM', '2026-05-10T23:59:00'],
      ['11:59:59 PM', '2026-05-10T23:59:59'],
      ['exactly 11:00 PM', '2026-05-10T23:00:00'],
    ])('returns false for %s, which marks a day boundary', (_description, value) => {
      // Act
      const result = hasTimePart(value);

      // Assert
      expect(result).toBe(false);
    });

    test.each([
      ['mid-afternoon', '2026-05-10T14:30:00'],
      ['one second after midnight', '2026-05-10T00:00:01'],
      ['half past midnight', '2026-05-10T00:30:00'],
      ['one second after 11:00 PM', '2026-05-10T23:00:01'],
      ['11:30 PM', '2026-05-10T23:30:00'],
    ])('returns true for %s', (_description, value) => {
      // Act
      const result = hasTimePart(value);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('getDefaultDateRange', () => {
    const now = new Date(2026, 9, 26, 12, 0, 0);

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('ends at the current time', () => {
      // Act
      const range = getDefaultDateRange();

      // Assert
      expect(range.end).toEqual(now);
    });

    test('starts the default number of days before the end', () => {
      // Arrange
      const expectedStart = new Date(2026, 9, 26 - DEFAULT_RANGE_DAYS, 12, 0, 0);

      // Act
      const range = getDefaultDateRange();

      // Assert
      expect(range.start).toEqual(expectedStart);
    });

    test('returns a start that is separate from the end', () => {
      // Act
      const range = getDefaultDateRange();

      // Assert
      expect(range.start).not.toBe(range.end);
    });
  });
});
