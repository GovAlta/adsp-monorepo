# CalendarClient

Framework-independent client that retrieves the events and statutory holidays needed to display a calendar for a visible date range. It depends only on `fetch` and has no React, Angular, Vue or FullCalendar dependency.

## Usage

```ts
import { CalendarClient } from '@abgov/adsp-components-core';

const client = new CalendarClient({
  serviceUrl: 'https://calendar-service.adsp.alberta.ca',
  tenant: 'my-tenant',
  getAccessToken: async () => token,
});

const { events, holidays } = await client.getCalendarRange('my-calendar', {
  start: new Date('2026-05-01T00:00:00-06:00'),
  end: new Date('2026-06-01T00:00:00-06:00'),
});
```

## Options

| Option           | Required | Description                                                                 |
| ---------------- | -------- | --------------------------------------------------------------------------- |
| `serviceUrl`     | Yes      | Root URL of the Calendar Service. The client appends `/calendar/v1`.        |
| `tenant`         | No       | Tenant name, sent as the `tenant` query parameter to read public events.    |
| `getAccessToken` | No       | Returns a bearer token for each request. Requests are anonymous if omitted. |
| `fetch`          | No       | Custom `fetch` implementation. Defaults to `globalThis.fetch`.              |
| `pageSize`       | No       | Page size for service requests. Defaults to 100.                            |

## Interface

```ts
interface ICalendarClient {
  getCalendarRange(calendar: string, range: DateRange): Promise<CalendarEvents>;
}
```

Depend on `ICalendarClient` in consumers so the client can be substituted in tests.

## Behaviour

- **Range:** `start` is inclusive and `end` is exclusive.
- **Events:** all events overlapping the range are returned, including those that start before the range or end after it. Events without an `end` are treated as points in time and included when their `start` is within the range.
- **Holidays:** statutory holidays whose Alberta calendar day falls within the range.
- **Pagination:** all pages are followed automatically.
- **Dates:** event times are `Date` values. Holiday `date` is the start of that day in the `America/Edmonton` time zone, and `day` is the same calendar day as a `yyyy-MM-dd` string, for display that doesn't depend on the browser's time zone.
- **Errors:** a non-successful response from the service throws an `Error` containing the status code.

## Models

```ts
interface CalendarEvents {
  events: CalendarEvent[];
  holidays: CalendarHoliday[];
}

interface CalendarEvent {
  id: number;
  name: string;
  description?: string;
  start: Date;
  end: Date | null;
  isAllDay: boolean;
  isPublic: boolean;
  recordId?: string;
  context?: Record<string, unknown>;
}

interface CalendarHoliday {
  date: Date;
  day: string;
  name: string;
  isInLieuOfDay: boolean;
}
```

## Limitations

The client asks the Calendar Service for events using the `from` and `to` query parameters, which the service limits to a range of 366 days. A service that ignores those parameters returns every event in pages, which the client follows and filters, so it can be slow for calendars with a long history.
