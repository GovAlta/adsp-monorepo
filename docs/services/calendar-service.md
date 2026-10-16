---
layout: page
title: Calendar service
nav_order: 12
parent: Services
---

# Calendar service
Calendar service provides information about dates, and a model for calendars, calendar events, and scheduling.

This service manages date and times in a particular timezone (America/Edmonton) rather than UTC or a particular UTC offset. In practice this means that dates within daylight savings will use MDT offset whereas dates outside will use MST offset. Date time values sent into the API will be converted to the service timezone.

## Client roles
client `urn:ads:platform:calendar-service`

| name | description |
|:-|:-|
| calendar-admin | Administrator role for calendar service. This role allows a user to create, update, and delete the tenant's calendar definitions, and to read and update events in any calendar. It is part of the tenant-admin composite role. |

`calendar-admin` is a Keycloak client role. It is created under the `urn:ads:platform:calendar-service` client when a tenant realm is created, and tenant administrators have it through the `tenant-admin` composite role. If your realm does not include it (for example, the realm was created before calendar service was available), add it from the *Service roles* tab of Access service in tenant administration. See [Access management](../important-notes.md#access-management).

Access to events is primarily controlled by each calendar's `readRoles` and `updateRoles`. Read roles grant access to private events and their attendees; update roles also grant permission to create, update, and delete events and attendees. `calendar-admin` grants both for all calendars.

## Concepts
### Dates
Calendar service provides informational endpoints for Dates that includes information like which days are business days and which are holidays.

### Calendar
A calendar is a container for *events*. Each calendar has a name, display name, and description, which are publicly accessible, and the `readRoles` and `updateRoles` that control access to its events.

Calendar definitions are stored in the [configuration service](configuration-service.md) under the `platform:calendar-service` namespace and name. Each definition has a `source`:
- `tenant` calendars are created and managed by the tenant using the calendar service API or the calendar service page in tenant administration.
- `core` calendars are registered by platform services, such as the `form-intake` calendar of form service. Tenants can use core calendars but cannot change them; they are view-only in tenant administration.

| Method | Path | Description | Required role |
|:-|:-|:-|:-|
| `GET` | `/calendar/v1/calendars` | Lists calendar definitions with their `source`. Anonymous requests only receive core calendars. | None |
| `GET` | `/calendar/v1/calendars/{name}` | Retrieves a calendar. | None |
| `POST` | `/calendar/v1/calendars` | Creates a tenant calendar. Returns 201 with the calendar. | `calendar-admin` |
| `PUT` | `/calendar/v1/calendars/{name}` | Replaces a tenant calendar. Returns 200 with the calendar. | `calendar-admin` |
| `DELETE` | `/calendar/v1/calendars/{name}` | Deletes a tenant calendar that has no events. Returns 204. | `calendar-admin` |

`calendar-admin` is sufficient to manage tenant calendars; `configuration-admin` is not required. Anonymous requests for a specific calendar, including its public events, must identify the tenant by name using the `tenant` query parameter. Platform (core) users specify the tenant using the `tenantId` query parameter.

Create and update requests take a body with the following properties; other properties are not allowed.

| property | required | description |
|:-|:-|:-|
| `name` | yes | Up to 50 letters, numbers, spaces, hyphens, or underscores. On update, this must match `{name}` in the path. |
| `displayName` | yes | Display name of up to 32 characters; cannot be blank. |
| `description` | no | Description of up to 250 characters. |
| `readRoles` | yes | Roles that can read private events and attendees. Can be an empty array. |
| `updateRoles` | yes | Roles that can read and change events and attendees. Can be an empty array. |

Create, update, and delete requests return:
- 400 if the request body or calendar name is invalid.
- 401 if the request is not authenticated.
- 403 if the user does not have the `calendar-admin` role in the tenant.
- 404 on update or delete if the tenant has no calendar with that name. Core calendars cannot be updated or deleted.
- 409 on create if a tenant or core calendar with the name already exists, or on delete if the calendar has events.
- 502 if the configuration service is unavailable.

Successful changes signal `calendar-definition-created`, `calendar-definition-updated`, and `calendar-definition-deleted` [domain events](event-service.md). Each event includes the calendar definition and the user who made the change.

### Calendar event
Calendar events represent a scheduled activity. Each event has some basic name and description information as well as start and end time. Events can be made public so that anonymous users can read their fields; their attendees remain accessible only to authorized users.

### Recurring event
An event can optionally repeat by including a `recurrence`. The model is a subset of the iCalendar (RFC 5545) recurrence rule:

| Property | Description |
|---|---|
| `frequency` | `daily`, `weekly`, `monthly`, or `yearly`. Monthly and yearly use the day of the event start; months or years without that day (e.g. the 31st, Feb 29) are skipped. |
| `interval` | Optional, defaults to 1. For example, `weekly` with `interval: 2` is every two weeks. |
| `daysOfWeek` | Optional, weekly only. Values from `MO`, `TU`, `WE`, `TH`, `FR`, `SA`, `SU`. Must include the day of the event start. |
| `end.until` | Optional. Last date (inclusive) that an occurrence can start. |
| `end.count` | Optional. Number of occurrences, including the first. Can't be used with `until`. |

The event `start` and `end` are the first occurrence. Occurrences are generated in Mountain time and keep the same local time across daylight saving changes.

- Retrieving events with `from` and `to` returns each occurrence in the range. Occurrences have the `id` of the recurring event and a `recurrenceId` with the original start of the occurrence.
- Retrieving events without `from` and `to` returns each recurring event once.
- Updating or deleting the event applies to all occurrences.
- `DELETE /calendar/v1/calendars/{name}/events/{id}/occurrences/{date}` cancels one occurrence. Cancelled occurrences are listed in `recurrence.exclusions` of the event and can't be restored.

### Attendee
Attendees represent people attending a particular *event*. Blank attendees (no name or email) can be created to represent available appointment slots.

## Code examples
### Getting business days
Calendar service API provides information endpoints for dates, including which dates are business days.
```typescript
  const top = 100;
  const criteria = {
    min: 20200101,
    max: 20220101,
    isBusinessDay: true,
  }

  const response = await fetch(
    `https://calendar-service.adsp.alberta.ca/calendar/v1/dates?top=${top}&criteria=${JSON.stringify(criteria)}`
  );

  const {
    results,
    page,
  } = await response.json();
```

### Creating a calendar
Requires the `calendar-admin` role.
```typescript
  const calendar = {
    name: 'site-inspections',
    displayName: 'Site inspections',
    description: 'Calendar of scheduled site inspections.',
    readRoles: ['inspection-viewer'],
    updateRoles: ['inspection-scheduler'],
  }

  const response = await fetch(
    'https://calendar-service.adsp.alberta.ca/calendar/v1/calendars',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendar),
    }
  );

  const {
    urn,
    name,
    displayName,
    source,
  } = await response.json();
```

### Creating a calendar event
```typescript
  const calendarEvent = {
    name: 'My Event',
    description: 'This is an example of a calendar event.',
    start: '2021-11-02T12:00:00Z',
    end: '2021-11-02T13:30:00Z',
    isPublic: false,
  }

  const response = await fetch(
    `https://calendar-service.adsp.alberta.ca/calendar/v1/calendars/${calendar}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    }
  );

  const {
    id,
    name,
    description,
    start,
    end,
    isPublic,
  } = await response.json();
```

### Creating a recurring calendar event
```typescript
  const calendarEvent = {
    name: 'Team meeting',
    start: '2026-09-29T10:00:00-06:00',
    end: '2026-09-29T11:00:00-06:00',
    recurrence: {
      frequency: 'weekly',
      daysOfWeek: ['TU'],
      end: { until: '2026-12-15' },
    },
  }

  const response = await fetch(
    `https://calendar-service.adsp.alberta.ca/calendar/v1/calendars/${calendar}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    }
  );

  const { id } = await response.json();

  // Cancel the October 13 occurrence only.
  await fetch(
    `https://calendar-service.adsp.alberta.ca/calendar/v1/calendars/${calendar}/events/${id}/occurrences/2026-10-13`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );
```
