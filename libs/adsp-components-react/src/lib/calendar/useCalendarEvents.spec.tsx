import { renderHook, waitFor } from '@testing-library/react';
import type { CalendarEvents, ICalendarClient } from '@abgov/adsp-components-core';
import { useCalendarEvents } from './useCalendarEvents';

const range = { start: new Date('2026-05-01T06:00:00Z'), end: new Date('2026-06-01T06:00:00Z') };

const calendarEvents: CalendarEvents = {
  events: [
    {
      id: 1,
      name: 'Event',
      start: new Date('2026-05-10T15:00:00Z'),
      end: null,
      isAllDay: false,
      isPublic: true,
    },
  ],
  holidays: [],
};

const createClient = (getCalendarRange: ICalendarClient['getCalendarRange']): ICalendarClient => ({
  getCalendarRange,
});

describe('useCalendarEvents', () => {
  test('is loading until the events are retrieved', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(calendarEvents));

    // Act
    const { result } = renderHook(() => useCalendarEvents(client, 'my-cal', range));

    // Assert
    expect(result.current).toEqual({ calendarEvents: null, loading: true, error: null });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toEqual({ calendarEvents, loading: false, error: null });
  });

  test('requests the calendar and range from the client', async () => {
    // Arrange
    const getCalendarRange = jest.fn().mockResolvedValue(calendarEvents);
    const client = createClient(getCalendarRange);

    // Act
    const { result } = renderHook(() => useCalendarEvents(client, 'my-cal', range));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Assert
    expect(getCalendarRange).toHaveBeenCalledWith('my-cal', range);
  });

  test('returns the error when the request fails', async () => {
    // Arrange
    const failure = new Error('Request failed');
    const client = createClient(jest.fn().mockRejectedValue(failure));

    // Act
    const { result } = renderHook(() => useCalendarEvents(client, 'my-cal', range));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Assert
    expect(result.current).toEqual({ calendarEvents: null, loading: false, error: failure });
  });

  test('wraps a non-error rejection in an error', async () => {
    // Arrange
    const client = createClient(jest.fn().mockRejectedValue('failed'));

    // Act
    const { result } = renderHook(() => useCalendarEvents(client, 'my-cal', range));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Assert
    expect(result.current.error).toEqual(new Error('failed'));
  });

  test('does not reload when given an equal range with new date objects', async () => {
    // Arrange
    const getCalendarRange = jest.fn().mockResolvedValue(calendarEvents);
    const client = createClient(getCalendarRange);

    // Act
    const { result, rerender } = renderHook(() =>
      useCalendarEvents(client, 'my-cal', { start: new Date(range.start), end: new Date(range.end) }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender();

    // Assert
    expect(getCalendarRange).toHaveBeenCalledTimes(1);
  });

  test('reloads and clears a previous error when the range changes', async () => {
    // Arrange
    const getCalendarRange = jest
      .fn()
      .mockRejectedValueOnce(new Error('Request failed'))
      .mockResolvedValue(calendarEvents);
    const client = createClient(getCalendarRange);
    const { result, rerender } = renderHook(({ r }) => useCalendarEvents(client, 'my-cal', r), {
      initialProps: { r: range },
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    // Act
    rerender({ r: { start: range.end, end: new Date('2026-07-01T06:00:00Z') } });

    // Assert
    await waitFor(() => expect(result.current.calendarEvents).toEqual(calendarEvents));
    expect(result.current.error).toBeNull();
    expect(getCalendarRange).toHaveBeenCalledTimes(2);
  });

  test('ignores a response that arrives after the range changed', async () => {
    // Arrange
    const stale: CalendarEvents = { events: [], holidays: [] };
    let resolveStale: (value: CalendarEvents) => void = () => undefined;
    const getCalendarRange = jest
      .fn()
      .mockReturnValueOnce(new Promise<CalendarEvents>((resolve) => (resolveStale = resolve)))
      .mockResolvedValue(calendarEvents);
    const client = createClient(getCalendarRange);
    const { result, rerender } = renderHook(({ r }) => useCalendarEvents(client, 'my-cal', r), {
      initialProps: { r: range },
    });

    // Act
    rerender({ r: { start: range.end, end: new Date('2026-07-01T06:00:00Z') } });
    await waitFor(() => expect(result.current.calendarEvents).toEqual(calendarEvents));
    resolveStale(stale);

    // Assert
    await Promise.resolve();
    expect(result.current.calendarEvents).toEqual(calendarEvents);
  });

  test('ignores a failure that arrives after the range changed', async () => {
    // Arrange
    let rejectStale: (reason: Error) => void = () => undefined;
    const getCalendarRange = jest
      .fn()
      .mockReturnValueOnce(new Promise<CalendarEvents>((_resolve, reject) => (rejectStale = reject)))
      .mockResolvedValue(calendarEvents);
    const client = createClient(getCalendarRange);
    const { result, rerender } = renderHook(({ r }) => useCalendarEvents(client, 'my-cal', r), {
      initialProps: { r: range },
    });

    // Act
    rerender({ r: { start: range.end, end: new Date('2026-07-01T06:00:00Z') } });
    await waitFor(() => expect(result.current.calendarEvents).toEqual(calendarEvents));
    rejectStale(new Error('Request failed'));

    // Assert
    await Promise.resolve();
    expect(result.current.error).toBeNull();
    expect(result.current.calendarEvents).toEqual(calendarEvents);
  });
});
