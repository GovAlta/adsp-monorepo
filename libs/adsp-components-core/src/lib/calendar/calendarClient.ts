import { getDateIdRange, isEventInRange, mapEvent, mapHoliday } from './mapper';
import type { CalendarServiceDate, CalendarServiceEvent } from './mapper';
import { CalendarEvent, CalendarEvents, CalendarHoliday, DateRange, ICalendarClient } from './types';

export interface CalendarClientOptions {
  /** Root URL of the Calendar Service, for example https://calendar-service.adsp.alberta.ca */
  serviceUrl: string;
  /** Tenant name for access to public events without a tenant token. */
  tenant?: string;
  getAccessToken?: () => Promise<string | undefined>;
  fetch?: typeof fetch;
  pageSize?: number;
}

interface PagedResults<T> {
  results: T[];
  page?: { next?: string };
}

const DEFAULT_PAGE_SIZE = 100;

export class CalendarClient implements ICalendarClient {
  private readonly apiUrl: string;
  private readonly tenant?: string;
  private readonly getAccessToken?: () => Promise<string | undefined>;
  private readonly fetchFn: typeof fetch;
  private readonly pageSize: number;

  constructor({ serviceUrl, tenant, getAccessToken, fetch: fetchFn, pageSize }: CalendarClientOptions) {
    this.apiUrl = new URL('/calendar/v1', serviceUrl).href;
    this.tenant = tenant;
    this.getAccessToken = getAccessToken;
    this.fetchFn = fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    this.pageSize = pageSize ?? DEFAULT_PAGE_SIZE;
  }

  async getCalendarEvents(calendar: string, range: DateRange): Promise<CalendarEvents> {
    const [events, holidays] = await Promise.all([this.getEvents(calendar, range), this.getHolidays(range)]);
    return { events, holidays };
  }

  private async getPage<T>(path: string, query: Record<string, string>): Promise<PagedResults<T>> {
    const url = new URL(`${this.apiUrl}${path}`);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));

    const token = await this.getAccessToken?.();
    const response = await this.fetchFn(
      url.href,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
    if (!response.ok) {
      throw new Error(`Calendar request failed with status ${response.status}.`);
    }

    return response.json();
  }

  // Pages through the results; a response without a next cursor is the last page.
  private async forEachPage<T>(
    path: string,
    query: Record<string, string>,
    onPage: (results: T[]) => void,
  ): Promise<void> {
    let after: string | undefined;
    do {
      const { results, page } = await this.getPage<T>(path, {
        ...query,
        top: `${this.pageSize}`,
        ...(after ? { after } : {}),
      });
      onPage(results);
      after = page?.next;
    } while (after);
  }

  private async getEvents(calendar: string, range: DateRange): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    // The service returns events overlapping from/to inclusively; filter again for the exclusive range end.
    // A service that ignores from/to responds with pages of every event, which the filter and paging also handle.
    await this.forEachPage<CalendarServiceEvent>(
      `/calendars/${encodeURIComponent(calendar)}/events`,
      {
        ...(range.start ? { from: range.start.toISOString() } : {}),
        ...(range.end ? { to: range.end.toISOString() } : {}),
        ...(this.tenant ? { tenant: this.tenant } : {}),
      },
      (results) => {
        events.push(...results.map(mapEvent).filter((event) => isEventInRange(event, range)));
      },
    );

    return events;
  }

  private async getHolidays(range: DateRange): Promise<CalendarHoliday[]> {
    const holidays: CalendarHoliday[] = [];

    await this.forEachPage<CalendarServiceDate>(
      '/dates',
      { criteria: JSON.stringify({ isHoliday: true, ...getDateIdRange(range) }) },
      (results) => {
        holidays.push(...results.map(mapHoliday));
      },
    );

    return holidays;
  }
}
