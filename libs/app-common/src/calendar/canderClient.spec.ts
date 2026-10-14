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

    expect(holidays.map((h) => h.date.toISOString())).toEqual(['2026-12-25T07:00:00.000Z', '2026-05-18T06:00:00.000Z']);
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
  });
});
