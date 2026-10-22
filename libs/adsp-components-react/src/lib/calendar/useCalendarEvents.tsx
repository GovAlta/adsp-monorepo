import { useEffect, useState } from 'react';
import type { CalendarEvents, DateRange, ICalendarClient } from '@abgov/adsp-components-core';

export interface UseCalendarEventsResult {
  calendarEvents: CalendarEvents | null;
  loading: boolean;
  error: Error | null;
}

// The client must be stable across renders (create it once or memoize it), otherwise events reload on every render.
// Nothing is fetched while range is undefined.
export function useCalendarEvents(
  client: ICalendarClient,
  calendar: string,
  range: DateRange | undefined,
): UseCalendarEventsResult {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Date objects change identity on every render, so depend on their time values instead.
  const start = range?.start?.getTime();
  const end = range?.end?.getTime();
  const hasRange = range !== undefined;

  useEffect(() => {
    if (!client || !hasRange) return;

    let current = true;
    setLoading(true);
    setError(null);

    client
      .getCalendarRange(calendar, {
        start: start === undefined ? undefined : new Date(start),
        end: end === undefined ? undefined : new Date(end),
      })
      .then((result) => {
        if (current) {
          setCalendarEvents(result);
        }
      })
      .catch((err: unknown) => {
        if (current) {
          setCalendarEvents(null);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (current) {
          setLoading(false);
        }
      });

    return () => {
      current = false;
    };
  }, [client, calendar, hasRange, start, end]);

  return { calendarEvents, loading, error };
}
