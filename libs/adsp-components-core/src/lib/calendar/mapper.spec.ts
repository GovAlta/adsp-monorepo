import { getDateIdRange, isEventInRange, mapEvent, mapHoliday, toDateId } from './mapper';
import type { CalendarEvent } from './types';

const createEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 1,
  name: 'Budget review',
  start: new Date('2026-05-10T15:00:00Z'),
  end: new Date('2026-05-10T16:00:00Z'),
  isAllDay: false,
  isPublic: true,
  ...overrides,
});

describe('toDateId', () => {
  it('uses the Alberta calendar day for an instant late in the evening', () => {
    // Arrange
    const instant = new Date('2026-05-11T05:30:00Z');

    // Act
    const id = toDateId(instant);

    // Assert
    expect(id).toBe(20260510);
  });
});

describe('getDateIdRange', () => {
  it('returns an undefined min and max for an unbounded range', () => {
    // Act
    const result = getDateIdRange({});

    // Assert
    expect(result).toEqual({ min: undefined, max: undefined });
  });

  it('returns only min for a range without an end', () => {
    // Act
    const result = getDateIdRange({ start: new Date('2026-05-01T06:00:00Z') });

    // Assert
    expect(result).toEqual({ min: 20260501, max: undefined });
  });

  it('returns only max for a range without a start', () => {
    // Act
    const result = getDateIdRange({ end: new Date('2026-06-01T06:00:00Z') });

    // Assert
    expect(result).toEqual({ min: undefined, max: 20260531 });
  });

  it('excludes the day starting at the exclusive range end', () => {
    // Act
    const result = getDateIdRange({ start: new Date('2026-05-01T06:00:00Z'), end: new Date('2026-06-01T06:00:00Z') });

    // Assert
    expect(result).toEqual({ min: 20260501, max: 20260531 });
  });

  it('never returns a max earlier than min', () => {
    // Act
    const result = getDateIdRange({ start: new Date('2026-05-10T06:00:00Z'), end: new Date('2026-05-10T06:00:00Z') });

    // Assert
    expect(result.max).toBe(20260510);
  });
});

describe('mapEvent', () => {
  it('maps optional fields to defaults when the service omits them', () => {
    // Act
    const event = mapEvent({ id: 7, name: 'Open house', start: '2026-05-10T15:00:00Z' });

    // Assert
    expect(event).toEqual({
      id: 7,
      name: 'Open house',
      description: undefined,
      start: new Date('2026-05-10T15:00:00Z'),
      end: null,
      isAllDay: false,
      isPublic: false,
      recordId: undefined,
      context: undefined,
      recurrenceId: undefined,
      recurrence: undefined,
    });
  });

  it('maps the recurrence id to a date', () => {
    // Act
    const event = mapEvent({
      id: 7,
      name: 'Weekly sync',
      start: '2026-05-10T15:00:00Z',
      recurrenceId: '2026-05-03T15:00:00Z',
    });

    // Assert
    expect(event.recurrenceId).toEqual(new Date('2026-05-03T15:00:00Z'));
  });
});

describe('mapHoliday', () => {
  it('uses an empty name when the date has no holiday name', () => {
    // Act
    const holiday = mapHoliday({ id: 20260518, holiday: null });

    // Assert
    expect(holiday.name).toBe('');
  });

  it('flags a holiday observed in lieu of another day', () => {
    // Act
    const holiday = mapHoliday({ id: 20260518, holiday: 'Victoria Day', isInLieuOfDay: true });

    // Assert
    expect(holiday.isInLieuOfDay).toBe(true);
  });

  it('starts the holiday at midnight Alberta time during standard time', () => {
    // Act
    const holiday = mapHoliday({ id: 20260115, holiday: 'Example' });

    // Assert
    expect(holiday.date).toEqual(new Date('2026-01-15T07:00:00Z'));
  });

  it('starts the holiday at midnight Alberta time during daylight saving time', () => {
    // Act
    const holiday = mapHoliday({ id: 20260518, holiday: 'Victoria Day' });

    // Assert
    expect(holiday.date).toEqual(new Date('2026-05-18T06:00:00Z'));
  });

  it('falls back to midnight UTC for an id that is not a valid Alberta day', () => {
    // Act
    const holiday = mapHoliday({ id: 20261340, holiday: 'Invalid' });

    // Assert
    expect(holiday.date).toEqual(new Date(Date.UTC(2026, 12, 40)));
  });
});

describe('isEventInRange', () => {
  const range = { start: new Date('2026-05-01T06:00:00Z'), end: new Date('2026-06-01T06:00:00Z') };

  it('includes an event that starts inside the range', () => {
    // Assert
    expect(isEventInRange(createEvent(), range)).toBe(true);
  });

  it('includes an event that began before the range and is still active', () => {
    // Arrange
    const event = createEvent({ start: new Date('2026-04-30T12:00:00Z'), end: new Date('2026-05-02T12:00:00Z') });

    // Assert
    expect(isEventInRange(event, range)).toBe(true);
  });

  it('excludes an event that ends before the range starts', () => {
    // Arrange
    const event = createEvent({ start: new Date('2026-04-01T12:00:00Z'), end: new Date('2026-04-02T12:00:00Z') });

    // Assert
    expect(isEventInRange(event, range)).toBe(false);
  });

  it('excludes an event that starts at the exclusive range end', () => {
    // Arrange
    const event = createEvent({ start: new Date('2026-06-01T06:00:00Z'), end: new Date('2026-06-01T07:00:00Z') });

    // Assert
    expect(isEventInRange(event, range)).toBe(false);
  });

  it('treats an event without an end as a point in time inside the range', () => {
    // Arrange
    const event = createEvent({ end: null });

    // Assert
    expect(isEventInRange(event, range)).toBe(true);
  });

  it('treats an event without an end as a point in time before the range', () => {
    // Arrange
    const event = createEvent({ start: new Date('2026-04-01T12:00:00Z'), end: null });

    // Assert
    expect(isEventInRange(event, range)).toBe(false);
  });

  it('treats an event ending at its start as a point in time', () => {
    // Arrange
    const start = new Date('2026-05-10T15:00:00Z');
    const event = createEvent({ start, end: start });

    // Assert
    expect(isEventInRange(event, range)).toBe(true);
  });

  it('includes every event for an unbounded range', () => {
    // Assert
    expect(isEventInRange(createEvent(), {})).toBe(true);
  });

  it('includes a recurring series that began before the range and has no end', () => {
    // Arrange
    const event = createEvent({
      start: new Date('2026-01-05T15:00:00Z'),
      recurrence: { frequency: 'weekly', daysOfWeek: ['MO'] },
    });

    // Assert
    expect(isEventInRange(event, range)).toBe(true);
  });

  it('includes a recurring series that ends after the range starts', () => {
    // Arrange
    const event = createEvent({
      start: new Date('2026-01-05T15:00:00Z'),
      recurrence: { frequency: 'weekly', end: { until: '2026-05-15T00:00:00Z' } },
    });

    // Assert
    expect(isEventInRange(event, range)).toBe(true);
  });

  it('excludes a recurring series that ended before the range starts', () => {
    // Arrange
    const event = createEvent({
      start: new Date('2026-01-05T15:00:00Z'),
      recurrence: { frequency: 'weekly', end: { until: '2026-03-01T00:00:00Z' } },
    });

    // Assert
    expect(isEventInRange(event, range)).toBe(false);
  });

  it('excludes a recurring series that starts after the range ends', () => {
    // Arrange
    const event = createEvent({
      start: new Date('2026-07-05T15:00:00Z'),
      recurrence: { frequency: 'weekly' },
    });

    // Assert
    expect(isEventInRange(event, range)).toBe(false);
  });
});
