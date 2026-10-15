import { CalendarClient } from './calendarClient';

type Handler = (url: URL) => unknown;

function mockFetch(handler: Handler) {
  return jest.fn(async (input: string) => ({
    ok: true,
    status: 200,
    json: async () => handler(new URL(input)),
  })) as unknown as jest.Mock & typeof fetch;
}

const serviceEvent = (id: number, start: string, end: string | null, extra = {}) => ({
  id,
  name: `event-${id}`,
  start,
  end,
  isAllDay: false,
  isPublic: true,
  ...extra,
});

describe('CalendarClient', () => {
  const range = { start: new Date('2026-05-01T06:00:00Z'), end: new Date('2026-06-01T06:00:00Z') };
  const serviceUrl = 'https://calendar.test/';

  const createClient = (fetchFn: typeof fetch, options = {}) =>
    new CalendarClient({ serviceUrl, fetch: fetchFn, ...options });

  it('returns events and holidays as domain models', async () => {
    const fetchFn = mockFetch((url) =>
      url.pathname.endsWith('/events')
        ? {
            results: [
              serviceEvent(1, '2026-05-10T09:00:00-06:00', '2026-05-10T10:00:00-06:00', {
                description: 'desc',
                recordId: 'r1',
                context: { a: 1 },
              }),
            ],
            page: {},
          }
        : { results: [{ id: 20260518, date: '2026-05-18T00:00:00.000Z', holiday: 'Victoria Day' }], page: {} },
    );

    const result = await createClient(fetchFn).getCalendarEvents('my-cal', range);

    expect(result.events).toEqual([
      {
        id: 1,
        name: 'event-1',
        description: 'desc',
        start: new Date('2026-05-10T15:00:00Z'),
        end: new Date('2026-05-10T16:00:00Z'),
        isAllDay: false,
        isPublic: true,
        recordId: 'r1',
        context: { a: 1 },
      },
    ]);
    expect(result.holidays).toEqual([
      { date: new Date('2026-05-18T06:00:00Z'), name: 'Victoria Day', isInLieuOfDay: false },
    ]);
  });

  it('normalizes holiday dates across daylight saving time', async () => {
    const fetchFn = mockFetch((url) =>
      url.pathname.endsWith('/events')
        ? { results: [] }
        : {
            results: [
              { id: 20261225, holiday: 'Christmas Day', isInLieuOfDay: false },
              { id: 20260518, holiday: 'Victoria Day', isInLieuOfDay: true },
            ],
          },
    );

    const { holidays } = await createClient(fetchFn).getCalendarEvents('my-cal', range);

    expect(holidays[1].isInLieuOfDay).toBe(true);
  });

  it('follows pagination for events and dates', async () => {
    const fetchFn = mockFetch((url) => {
      const after = url.searchParams.get('after');
      if (url.pathname.endsWith('/events')) {
        return after === 'e2'
          ? { results: [serviceEvent(3, '2026-05-20T10:00:00Z', null)], page: {} }
          : after === 'e1'
            ? { results: [serviceEvent(2, '2026-05-15T10:00:00Z', null)], page: { next: 'e2' } }
            : { results: [serviceEvent(1, '2026-05-10T10:00:00Z', null)], page: { next: 'e1' } };
      }
      return after === 'd1'
        ? { results: [{ id: 20260520, holiday: 'B' }], page: {} }
        : { results: [{ id: 20260518, holiday: 'A' }], page: { next: 'd1' } };
    });

    const result = await createClient(fetchFn).getCalendarEvents('my-cal', range);

    expect(result.events.map((e) => e.id)).toEqual([1, 2, 3]);
    expect(result.holidays.map((h) => h.name)).toEqual(['A', 'B']);
    expect(fetchFn).toHaveBeenCalledTimes(5);
  });

  it('passes the page cursor and page size to each request', async () => {
    const fetchFn = mockFetch((url) =>
      url.pathname.endsWith('/events') && !url.searchParams.get('after')
        ? { results: [serviceEvent(1, '2026-05-10T10:00:00Z', null)], page: { next: 'cursor-1' } }
        : { results: [] },
    );

    await createClient(fetchFn, { pageSize: 25 }).getCalendarEvents('my-cal', range);

    const eventUrls = fetchFn.mock.calls.map(([url]) => new URL(url)).filter((u) => u.pathname.endsWith('/events'));
    expect(eventUrls).toHaveLength(2);
    expect(eventUrls[0].searchParams.get('top')).toBe('25');
    expect(eventUrls[0].searchParams.get('after')).toBeNull();
    expect(eventUrls[1].searchParams.get('after')).toBe('cursor-1');
  });

  it('returns empty results when the service has no events or holidays', async () => {
    const fetchFn = mockFetch(() => ({ results: [], page: {} }));

    const result = await createClient(fetchFn).getCalendarEvents('my-cal', range);

    expect(result).toEqual({ events: [], holidays: [] });
  });

  it('includes boundary-crossing events found on later pages and stops once events start after the range', async () => {
    const fetchFn = mockFetch((url) => {
      if (!url.pathname.endsWith('/events')) {
        return { results: [] };
      }
      switch (url.searchParams.get('after')) {
        case 'p2':
          return {
            results: [
              serviceEvent(2, '2026-04-30T12:00:00Z', '2026-05-02T12:00:00Z'),
              serviceEvent(3, '2026-05-31T12:00:00Z', '2026-06-03T12:00:00Z'),
            ],
            page: { next: 'p3' },
          };
        case 'p3':
          return { results: [serviceEvent(4, '2026-06-05T00:00:00Z', null)], page: { next: 'p4' } };
        case 'p4':
          throw new Error('Page after the range should not be requested.');
        default:
          return {
            results: [serviceEvent(1, '2026-04-01T00:00:00Z', '2026-04-02T00:00:00Z')],
            page: { next: 'p2' },
          };
      }
    });

    const result = await createClient(fetchFn).getCalendarEvents('my-cal', range);

    expect(result.events.map((e) => e.id)).toEqual([2, 3]);
    const eventCalls = fetchFn.mock.calls.filter(([url]) => new URL(url).pathname.endsWith('/events'));
    expect(eventCalls).toHaveLength(3);
  });

  describe('range overlap', () => {
    const getIds = async (events: ReturnType<typeof serviceEvent>[]) => {
      const fetchFn = mockFetch((url) => (url.pathname.endsWith('/events') ? { results: events } : { results: [] }));
      const result = await createClient(fetchFn).getCalendarEvents('my-cal', range);
      return result.events.map((e) => e.id);
    };

    it('includes events crossing the start boundary', async () => {
      expect(await getIds([serviceEvent(1, '2026-04-30T12:00:00Z', '2026-05-01T12:00:00Z')])).toEqual([1]);
    });

    it('includes events crossing the end boundary', async () => {
      expect(await getIds([serviceEvent(1, '2026-05-31T12:00:00Z', '2026-06-02T12:00:00Z')])).toEqual([1]);
    });

    it('includes events spanning the whole range', async () => {
      expect(await getIds([serviceEvent(1, '2026-04-01T00:00:00Z', '2026-07-01T00:00:00Z')])).toEqual([1]);
    });

    it('excludes events outside the range or ending exactly at the start', async () => {
      expect(
        await getIds([
          serviceEvent(1, '2026-04-01T00:00:00Z', '2026-04-02T00:00:00Z'),
          serviceEvent(2, '2026-04-30T00:00:00Z', '2026-05-01T06:00:00Z'),
          serviceEvent(3, '2026-06-01T06:00:00Z', '2026-06-02T00:00:00Z'),
        ]),
      ).toEqual([]);
    });

    it('treats events without an end as points in time', async () => {
      expect(
        await getIds([
          serviceEvent(1, '2026-04-30T00:00:00Z', null),
          serviceEvent(2, '2026-05-01T06:00:00Z', null),
          serviceEvent(3, '2026-06-01T06:00:00Z', null),
        ]),
      ).toEqual([2]);
    });

    it('excludes events starting exactly at the range end and includes those starting just before it', async () => {
      expect(
        await getIds([
          serviceEvent(1, '2026-06-01T05:59:59.999Z', '2026-06-01T12:00:00Z'),
          serviceEvent(2, '2026-06-01T06:00:00Z', '2026-06-01T12:00:00Z'),
        ]),
      ).toEqual([1]);
    });

    it('includes events that start at the range start', async () => {
      expect(await getIds([serviceEvent(1, '2026-05-01T06:00:00Z', '2026-05-01T07:00:00Z')])).toEqual([1]);
    });

    it('treats events ending at or before their start as points in time', async () => {
      expect(
        await getIds([
          serviceEvent(1, '2026-05-10T10:00:00Z', '2026-05-10T10:00:00Z'),
          serviceEvent(2, '2026-05-11T10:00:00Z', '2026-05-11T09:00:00Z'),
          serviceEvent(3, '2026-04-30T10:00:00Z', '2026-04-30T10:00:00Z'),
        ]),
      ).toEqual([1, 2]);
    });

    it('stops retrieving pages once events start after the range', async () => {
      const fetchFn = mockFetch((url) =>
        url.pathname.endsWith('/events')
          ? { results: [serviceEvent(1, '2026-07-01T00:00:00Z', null)], page: { next: 'more' } }
          : { results: [] },
      );

      await createClient(fetchFn).getCalendarEvents('my-cal', range);

      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('requests', () => {
    it('queries holiday dates by Alberta date id for the range', async () => {
      const fetchFn = mockFetch(() => ({ results: [] }));

      await createClient(fetchFn).getCalendarEvents('my-cal', range);

      const urls = fetchFn.mock.calls.map(([url]) => new URL(url));
      const dates = urls.find((u) => u.pathname === '/calendar/v1/dates');
      expect(JSON.parse(dates.searchParams.get('criteria'))).toEqual({ isHoliday: true, min: 20260501, max: 20260531 });
      expect(dates.searchParams.get('top')).toBe('100');

      const events = urls.find((u) => u.pathname === '/calendar/v1/calendars/my-cal/events');
      expect(JSON.parse(events.searchParams.get('criteria'))).toEqual({ orderBy: 'start' });
    });

    it('queries a multi-month range using the first and last Alberta day', async () => {
      const fetchFn = mockFetch(() => ({ results: [] }));

      await createClient(fetchFn).getCalendarEvents('my-cal', {
        start: new Date('2026-05-01T06:00:00Z'),
        end: new Date('2026-08-01T06:00:00Z'),
      });

      const dates = fetchFn.mock.calls.map(([url]) => new URL(url)).find((u) => u.pathname === '/calendar/v1/dates');
      expect(JSON.parse(dates.searchParams.get('criteria'))).toEqual({ isHoliday: true, min: 20260501, max: 20260731 });
    });

    it('uses the Alberta calendar day rather than the UTC day for date ids', async () => {
      const fetchFn = mockFetch(() => ({ results: [] }));

      // 2026-05-02T03:00Z is still May 1 in Alberta (UTC-6).
      await createClient(fetchFn).getCalendarEvents('my-cal', {
        start: new Date('2026-05-01T20:00:00Z'),
        end: new Date('2026-05-02T03:00:00Z'),
      });

      const dates = fetchFn.mock.calls.map(([url]) => new URL(url)).find((u) => u.pathname === '/calendar/v1/dates');
      expect(JSON.parse(dates.searchParams.get('criteria'))).toEqual({ isHoliday: true, min: 20260501, max: 20260501 });
    });

    it('requests events for the named calendar, encoding the name', async () => {
      const fetchFn = mockFetch(() => ({ results: [] }));

      await createClient(fetchFn).getCalendarEvents('my cal/1', range);

      const events = fetchFn.mock.calls.map(([url]) => new URL(url)).find((u) => u.pathname.includes('/events'));
      expect(events.pathname).toBe('/calendar/v1/calendars/my%20cal%2F1/events');
    });

    it('does not send the tenant parameter when retrieving dates', async () => {
      const fetchFn = mockFetch(() => ({ results: [] }));

      await createClient(fetchFn, { tenant: 'my-tenant' }).getCalendarEvents('my-cal', range);

      const dates = fetchFn.mock.calls.map(([url]) => new URL(url)).find((u) => u.pathname === '/calendar/v1/dates');
      expect(dates.searchParams.has('tenant')).toBe(false);
    });

    it('sends anonymous requests when no token is provided', async () => {
      const fetchFn = mockFetch(() => ({ results: [] }));

      await createClient(fetchFn, { getAccessToken: async () => undefined }).getCalendarEvents('my-cal', range);

      expect(fetchFn.mock.calls.every(([, init]) => init === undefined)).toBe(true);
    });

    it('applies tenant and access token', async () => {
      const fetchFn = mockFetch(() => ({ results: [] }));

      await createClient(fetchFn, { tenant: 'my-tenant', getAccessToken: async () => 'token' }).getCalendarEvents(
        'my-cal',
        range,
      );

      const eventsCall = fetchFn.mock.calls.find(([url]) => url.includes('/events'));
      expect(new URL(eventsCall[0]).searchParams.get('tenant')).toBe('my-tenant');
      expect(eventsCall[1]).toEqual({ headers: { Authorization: 'Bearer token' } });
    });

    it('throws when the service responds with an error', async () => {
      const fetchFn = jest.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;

      await expect(createClient(fetchFn).getCalendarEvents('my-cal', range)).rejects.toThrow('status 500');
    });

    it('throws when only the dates request fails', async () => {
      const fetchFn = jest.fn(async (input: string) => {
        const isEvents = new URL(input).pathname.endsWith('/events');
        return { ok: isEvents, status: isEvents ? 200 : 503, json: async () => ({ results: [] }) };
      }) as unknown as typeof fetch;

      await expect(createClient(fetchFn).getCalendarEvents('my-cal', range)).rejects.toThrow('status 503');
    });

    it('throws when a later events page fails', async () => {
      const fetchFn = jest.fn(async (input: string) => {
        const url = new URL(input);
        const isLaterPage = url.searchParams.has('after');
        return {
          ok: !isLaterPage,
          status: isLaterPage ? 502 : 200,
          json: async () => ({
            results: [],
            page: url.pathname.endsWith('/events') ? { next: 'more' } : {},
          }),
        };
      }) as unknown as typeof fetch;

      await expect(createClient(fetchFn).getCalendarEvents('my-cal', range)).rejects.toThrow('status 502');
    });
  });
});
