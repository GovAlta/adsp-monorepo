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
| calendar-admin | Administrator role for calendar service. This role allows a user to manage tenant calendar definitions and read or update calendar events. |

Event access is primarily controlled by each calendar's `updateRoles` and `readRoles`: the roles that grant update and read permission, respectively.

## Concepts
### Dates
Calendar service provides informational endpoints for Dates that includes information like which days are business days and which are holidays.

### Calendar
A calendar is a container for *events*. Each calendar has basic name and description information which is publicly accessible. Calendar definitions are managed through the calendar-service API; calendar-service stores them in the [configuration service](configuration-service.md) under `platform:calendar-service`.

`GET /calendar/v1/calendars` lists definitions with a `source` of `tenant` or `core`. Tenant users see both; anonymous requests see core definitions. Core definitions are view-only in the tenant admin app. `GET /calendar/v1/calendars/{name}` retrieves an individual definition.

Users with `calendar-admin` for the tenant can manage **tenant** definitions without `configuration-admin`:

| Method | Path | Action |
|:-|:-|:-|
| `POST` | `/calendar/v1/calendars` | Create a definition (201). |
| `PUT` | `/calendar/v1/calendars/{name}` | Replace a tenant definition (200). |
| `DELETE` | `/calendar/v1/calendars/{name}` | Remove an unused tenant definition (204). |

Create and update bodies require a valid `name`, a nonblank `displayName` of at most 32 characters, and `readRoles` and `updateRoles` arrays of strings (which may be empty). `description` is optional and may contain at most 250 characters. On update, the body name must match `{name}`. Invalid input returns 400; unauthenticated requests return 401, and requests without `calendar-admin` return 403. Updates and deletes of absent tenant definitions return 404, and duplicate creates or deletion of a calendar containing events return 409. Core definitions cannot be changed through these endpoints.

Successful definition writes signal `calendar-definition-created`, `calendar-definition-updated`, and `calendar-definition-deleted` events for the tenant.

### Calendar event
Calender events represent a scheduled activity. Each event has some basic name and description information as well as start and end time. Events can be made public so that anonymous users can read their fields; their attendees remain accessible only to authorized users.

### Attendee
Attendees represent people attending a particular *event*. Blanks attendees (no name or email) can be created to represent available appointment slots.

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
