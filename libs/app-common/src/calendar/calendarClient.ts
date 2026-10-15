import axios, { AxiosInstance } from 'axios';
import { getDateIdRange, isEventInRange, mapEvent, mapHoliday } from './mapper';
import type { CalendarServiceDate, CalendarServiceEvent } from './mapper';
import { CalendarEvent, CalendarEvents, CalendarHoliday, DateRange, ICalendarClient } from './types';

export interface CalendarClientOptions {
  /** Root URL of the Calendar Service, for example https://calendar-service.adsp.alberta.ca */
  serviceUrl: string;
  /** Tenant name for access to public events without a tenant token. */
  tenant?: string;
  getAccessToken?: () => Promise<string | undefined>;
  http?: AxiosInstance;
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
  private readonly http: AxiosInstance;
  private readonly pageSize: number;

  constructor({ serviceUrl, tenant, getAccessToken, http, pageSize }: CalendarClientOptions) {
    this.apiUrl = `${serviceUrl.replace(/\/+$/, '')}/calendar/v1`;
    this.tenant = tenant;
    this.getAccessToken = getAccessToken;
    this.http = http ?? axios;
    this.pageSize = pageSize ?? DEFAULT_PAGE_SIZE;
  }

  async getCalendarEvents(calendar: string, range: DateRange): Promise<CalendarEvents> {
    const [events, holidays] = await Promise.all([this.getEvents(calendar, range), this.getHolidays(range)]);
    return { events, holidays };
  }

  private async getPage<T>(path: string, query: Record<string, string>): Promise<PagedResults<T>> {
    const token = await this.getAccessToken?.();
    const { data } = await this.http.get<PagedResults<T>>(`${this.apiUrl}${path}`, {
      params: query,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    return data;
  }

  // Returns false from onPage to stop paging early.
  private async forEachPage<T>(
    path: string,
    query: Record<string, string>,
    onPage: (results: T[]) => boolean | void,
  ): Promise<void> {
    let after: string | undefined;
    do {
      const { results, page } = await this.getPage<T>(path, {
        ...query,
        top: `${this.pageSize}`,
        ...(after ? { after } : {}),
      });
      if (onPage(results) === false) {
        return;
      }
      after = page?.next;
    } while (after);
  }

  private async getEvents(calendar: string, range: DateRange): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    // The service has no overlap query: startsAfter/endsBefore would drop events crossing the range boundaries.
    // Retrieve all events ordered by start, then filter; ordering allows stopping once starts pass the range end.
    await this.forEachPage<CalendarServiceEvent>(
      `/calendars/${encodeURIComponent(calendar)}/events`,
      {
        criteria: JSON.stringify({ orderBy: 'start' }),
        ...(this.tenant ? { tenant: this.tenant } : {}),
      },
      (results) => {
        for (const result of results) {
          const event = mapEvent(result);
          if (event.start.getTime() >= range.end.getTime()) {
            return false;
          }
          if (isEventInRange(event, range)) {
            events.push(event);
          }
        }
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
