import type { CalendarEvent } from '@abgov/adsp-components-core';
import {
  mapRecurrenceEvent,
  mapRecurrentMonthlyEvent,
  mapRecurrentWeeklyEvent,
  mapRecurrentYearlyEvent,
} from './mapper';

const createEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 12,
  name: 'Team standup',
  start: new Date('2026-07-15T18:30:15.123Z'),
  end: null,
  isAllDay: false,
  isPublic: true,
  recurrence: {
    frequency: 'weekly',
    interval: 2,
    daysOfWeek: ['MO', 'WE'],
    end: { until: '2026-12-31' },
  },
  ...overrides,
});

const mappers = [
  ['mapRecurrentWeeklyEvent', mapRecurrentWeeklyEvent, 'Reocurring weekly event'],
  ['mapRecurrentMonthlyEvent', mapRecurrentMonthlyEvent, 'Reocurring monthly event'],
  ['mapRecurrentYearlyEvent', mapRecurrentYearlyEvent, 'Reocurring yearly event'],
] as const;

describe('mapper', () => {
  describe.each(mappers)('%s', (_name, mapEvent, defaultTitle) => {
    test('uses the event name as the title', () => {
      // Arrange
      const event = createEvent({ name: 'Team standup', description: 'Daily sync' });

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.title).toBe('Team standup');
    });

    test('falls back to the description when the name is empty', () => {
      // Arrange
      const event = createEvent({ name: '', description: 'Daily sync' });

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.title).toBe('Daily sync');
    });

    test('falls back to the recurrence date when the name and description are missing', () => {
      // Arrange
      const recurrenceId = new Date(2026, 6, 15, 12);
      const event = createEvent({ name: '', description: undefined, recurrenceId });

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.title).toBe(recurrenceId.toDateString());
    });

    test('falls back to a default title when no title source is available', () => {
      // Arrange
      const event = createEvent({ name: '', description: undefined, recurrenceId: undefined });

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.title).toBe(defaultTitle);
    });

    test('sets the recurrence frequency', () => {
      // Arrange
      const event = createEvent({ recurrence: { frequency: 'weekly', end: { until: '2026-12-31' } } });

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.rrule.freq).toBe('weekly');
    });

    test('starts the recurrence at the event start in the Alberta time zone', () => {
      // Arrange
      const event = createEvent();

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.rrule.dtstart).toBe('2026-07-15T12:30:15.123-06:00');
    });

    test('ends a date-only recurrence at the end of that day', () => {
      // Arrange
      const event = createEvent({ recurrence: { frequency: 'weekly', end: { until: '2026-12-31' } } });

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.rrule.until).toBe('2026-12-31T23:59:59.000-06:00');
    });

    test('keeps the recurrence end as-is when it has a time part', () => {
      // Arrange
      const event = createEvent({ recurrence: { frequency: 'weekly', end: { until: '2026-12-31T10:00:00' } } });

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.rrule.until).toBe('2026-12-31T10:00:00');
    });

    test('does not set a duration', () => {
      // Arrange
      const event = createEvent();

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.duration).toBeUndefined();
    });
  });

  describe.each([
    ['mapRecurrentWeeklyEvent', mapRecurrentWeeklyEvent],
    ['mapRecurrentMonthlyEvent', mapRecurrentMonthlyEvent],
  ] as const)('%s interval handling', (_name, mapEvent) => {
    test('is editable', () => {
      // Arrange
      const event = createEvent();

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.editable).toBe(true);
    });

    test('sets the recurrence interval', () => {
      // Arrange
      const event = createEvent();

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.rrule.interval).toBe(2);
    });

    test('sets the weekdays of the recurrence', () => {
      // Arrange
      const event = createEvent();

      // Act
      const result = mapEvent(event);

      // Assert
      expect(result.rrule.byweekday).toEqual(['MO', 'WE']);
    });
  });

  describe('mapRecurrentYearlyEvent', () => {
    test('is not editable', () => {
      // Arrange
      const event = createEvent({ recurrence: { frequency: 'yearly', end: { until: '2030-12-31' } } });

      // Act
      const result = mapRecurrentYearlyEvent(event);

      // Assert
      expect(result.editable).toBeUndefined();
    });

    test('does not set an interval or weekdays', () => {
      // Arrange
      const event = createEvent({ recurrence: { frequency: 'yearly', end: { until: '2030-12-31' } } });

      // Act
      const result = mapRecurrentYearlyEvent(event);

      // Assert
      expect(result.rrule).toEqual({
        freq: 'yearly',
        dtstart: '2026-07-15T12:30:15.123-06:00',
        until: '2030-12-31T23:59:59.000-06:00',
      });
    });
  });

  describe('mapRecurrenceEvent', () => {
    test.each([
      ['weekly', 'Reocurring weekly event'],
      ['monthly', 'Reocurring monthly event'],
      ['yearly', 'Reocurring yearly event'],
    ] as const)('maps a %s event with the matching mapper', (frequency, expectedTitle) => {
      // Arrange
      const event = createEvent({
        name: '',
        recurrence: { frequency, end: { until: '2026-12-31' } },
      });

      // Act
      const result = mapRecurrenceEvent(event);

      // Assert
      expect(result?.title).toBe(expectedTitle);
    });

    test('returns null for a frequency with no mapper', () => {
      // Arrange
      const event = createEvent({ recurrence: { frequency: 'daily', end: { until: '2026-12-31' } } });

      // Act
      const result = mapRecurrenceEvent(event);

      // Assert
      expect(result).toBeNull();
    });

    test('returns null for an event with no recurrence', () => {
      // Arrange
      const event = createEvent({ recurrence: undefined });

      // Act
      const result = mapRecurrenceEvent(event);

      // Assert
      expect(result).toBeNull();
    });
  });
});
