---
layout: page
title: Calendar service
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

Access to events is primarily controlled by each calendar's `readRoles` and `updateRoles`, which can be any roles of the tenant realm:

| Caller | Public events | Private events | Attendees | Create, update, and delete events and attendees |
|:-|:-|:-|:-|:-|
| Anonymous, users without a calendar role, and users of another tenant | Read | No | No | No |
| Users with one of the calendar's `readRoles` | Read | Read | Read | No |
| Users with one of the calendar's `updateRoles` | Read | Read | Read | Yes |
| Users with `calendar-admin` | Read | Read | Read | Yes |

A role grants access only in the user's own tenant. Core (platform) users with `calendar-admin` or one of the calendar's roles have the same access in any tenant. Callers without access to private events receive only public events from list and export requests, and `403` for a private event, for attendees, or for `includeAttendees=true`. Attendees are never public, even for public events.

## Tenancy
Calendars, events, and attendees belong to one tenant. Dates are platform data, the same for every tenant.

- **Tenant users and service accounts** act on the tenant of their token.
- **Core (platform) users and service accounts** set the `tenantId` query parameter (for example, `?tenantId=urn:ads:platform:tenant-service:v2:/tenants/{id}`). Calendar definition changes, and requests for a specific calendar or its events, respond `400` when there is no tenant context.
- **Anonymous users and users of another tenant** can read the public events of a tenant's calendar by naming the tenant with the `tenant` query parameter (for example, `?tenant=service-delivery`). The `tenant` parameter can be used on every `/calendars/{name}` endpoint and replaces the tenant of the token or `tenantId`. A user's roles only apply in their own tenant, so a user of another tenant only receives public events. An unknown tenant name responds `400`.
- **Platform versus tenant calendars.** `GET /calendars` lists the tenant's calendars (`source: tenant`) and the platform's core calendars (`source: core`) separately. Anonymous requests, and core users without `tenantId`, only receive core calendars. Core calendars can be used by every tenant, and each tenant's events in a core calendar are separate. Tenants can't create a calendar with the name of a core calendar, and can't change or delete core calendars. If a tenant and a core calendar have the same name, the core calendar is used.
- **Isolation.** Event and attendee IDs from another tenant or calendar respond `404`.

## API overview
All endpoints are under `https://calendar-service.adsp.alberta.ca/calendar/v1`. Requests without a bearer token are anonymous. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Area | Endpoints | Required role |
|:-|:-|:-|
| Dates | `GET /dates`, `GET /dates/{id}` | None (anonymous allowed) |
| Calendars | `GET /calendars`, `GET /calendars/{name}` | None (anonymous allowed) |
| | `POST /calendars`, `PUT /calendars/{name}`, `DELETE /calendars/{name}` | `calendar-admin` |
| Events | `GET /calendars/{name}/events`, `GET /calendars/{name}/events/{id}`, `GET /calendars/{name}/export` | None for public events. Private events and `includeAttendees` need `calendar-admin`, or one of the calendar's `readRoles` or `updateRoles` |
| | `POST /calendars/{name}/events`, `PATCH\|DELETE /calendars/{name}/events/{id}`, `DELETE /calendars/{name}/events/{id}/occurrences/{occurrence}` | `calendar-admin`, or one of the calendar's `updateRoles` |
| Attendees | `GET /calendars/{name}/events/{id}/attendees`, `GET /calendars/{name}/events/{id}/attendees/{attendeeId}` | `calendar-admin`, or one of the calendar's `readRoles` or `updateRoles` |
| | `POST /calendars/{name}/events/{id}/attendees`, `PUT\|DELETE /calendars/{name}/events/{id}/attendees/{attendeeId}` | `calendar-admin`, or one of the calendar's `updateRoles` |

Calendar definition changes (`POST`, `PUT`, and `DELETE /calendars`) respond `401` without a bearer token. Other endpoints accept anonymous requests and respond `403` when the caller doesn't have the role. Requests that list events or attendees, or change them, respond `404` if the calendar or event doesn't exist in the tenant.

## Concepts
### Dates
Calendar service provides informational endpoints for Dates that includes information like which days are business days and which are holidays. Each date has an ID in the format `yyyyMMdd` (for example, `20261111`).

### Calendar
A calendar is a container for *events*. Each calendar has a name, display name, and description, which are publicly accessible, and the `readRoles` and `updateRoles` that control access to its events.

Calendar definitions are stored in the [configuration service](configuration-service.md) under the `platform:calendar-service` namespace and name. Each definition has a `source`:
- `tenant` calendars are created and managed by the tenant using the calendar service API or the calendar service page in tenant administration.
- `core` calendars are registered by platform services, such as the `form-intake` calendar of form service. Tenants can use core calendars but cannot change them; they are view-only in tenant administration.

`calendar-admin` is sufficient to manage tenant calendars; `configuration-admin` is not required.

Create and update requests take a body with the following properties; other properties are not allowed.

| property | required | description |
|:-|:-|:-|
| `name` | yes | Up to 50 letters, numbers, spaces, hyphens, or underscores. On update, this must match `{name}` in the path. |
| `displayName` | yes | Display name of up to 32 characters; cannot be blank. |
| `description` | no | Description of up to 250 characters. |
| `readRoles` | yes | Roles that can read private events and attendees. Can be an empty array. |
| `updateRoles` | yes | Roles that can read and change events and attendees. Can be an empty array. |

Create, update, and delete requests return:
- 400 if the request body or calendar name is invalid, or there is no tenant context.
- 401 if the request is not authenticated.
- 403 if the user does not have the `calendar-admin` role in the tenant.
- 404 on update or delete if the tenant has no calendar with that name. Core calendars cannot be updated or deleted.
- 409 on create if a tenant or core calendar with the name already exists, or on delete if the calendar has events.
- 502 if the configuration service is unavailable.

### Calendar event
Calendar events represent a scheduled activity. Each event has a name (up to 50 characters), an optional description, and a start and end time; `end` is required when creating an event and can't be before `start`. An event can also have a `recordId` to link it to a record in another system, and a `context` object of properties that can be used as criteria to find it.

Events are private unless `isPublic` is `true`. Anyone, including anonymous users, can read the fields of a public event. Private events are only returned to callers with one of the calendar's roles or `calendar-admin` (see [Client roles](#client-roles)).

Updates (`PATCH`) change only the properties in the request. `end`, `name`, `description`, and `context` can be changed but not cleared, and `recordId` can't be changed.

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
Attendees represent people attending a particular *event*. Each attendee has a `name` and an `email`. The email is required and must be a valid email address; the name can be an empty string. Attendees are never public: reading them requires one of the calendar's roles or `calendar-admin`, even for public events.

## Events
Calendar service sends these [domain events](event-service.md). It doesn't consume any events.

| Event | Sent when | Payload |
|:-|:-|:-|
| `calendar-definition-created` | A tenant calendar is created. | `calendar` definition and `createdBy` user. |
| `calendar-definition-updated` | A tenant calendar is updated. | `calendar` definition and `updatedBy` user. |
| `calendar-definition-deleted` | A tenant calendar is deleted. | `calendar` definition and `deletedBy` user. |
| `calendar-event-created` | An event is created. | `calendar`, `event`, and `createdBy` user. |
| `calendar-event-updated` | An event is updated, an occurrence is cancelled, or an attendee is added, set, or removed. | `calendar`, `event`, the `update` (with an `operation` of `add-attendee`, `set-attendee`, `delete-attendee`, or `exclude-occurrence` for those changes), and `updatedBy` user. |
| `calendar-event-deleted` | An event is deleted. | `calendar`, `event`, and `deletedBy` user. |

Event payloads include the fields of private events, and the `add-attendee` and `set-attendee` updates include the attendee's name and email. Anyone who can read the tenant's event log can see them.

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
    `https://calendar-service.adsp.alberta.ca/calendar/v1/dates?top=${top}&criteria=${encodeURIComponent(JSON.stringify(criteria))}`
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
Requires `calendar-admin` or one of the calendar's `updateRoles`.
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

### Reading public events without signing in
Anonymous requests name the tenant with the `tenant` query parameter and only receive public events. The `from` and `to` range returns every event and occurrence in the range in one response.
```typescript
  const params = new URLSearchParams({
    tenant: 'service-delivery',
    from: '2026-10-01T00:00:00-06:00',
    to: '2026-10-31T23:59:59-06:00',
  });

  const response = await fetch(
    `https://calendar-service.adsp.alberta.ca/calendar/v1/calendars/${calendar}/events?${params}`
  );

  const { results } = await response.json();
  for (const { id, recurrenceId, name, start, end } of results) {
    // Occurrences of a recurring event share its id and have a recurrenceId.
  }
```

### Adding an attendee to an event
Requires `calendar-admin` or one of the calendar's `updateRoles`.
```typescript
  const response = await fetch(
    `https://calendar-service.adsp.alberta.ca/calendar/v1/calendars/${calendar}/events/${eventId}/attendees`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test User', email: 'test.user@gov.ab.ca' }),
    }
  );

  const { id, name, email } = await response.json();
```
