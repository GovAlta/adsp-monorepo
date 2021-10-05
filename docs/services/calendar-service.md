---
layout: page
title: Calendar service
nav_order: 11
parent: Services
---

# Calendar service
Calendar service provides information about dates, and a model for calendars, calendar events, and scheduling.

This service manages date and times in a particular timezone (America/Edmonton) rather than UTC or a particular UTC offset. In practice this means that dates within daylight savings will use MDT offset whereas dates outside will use MST offset. Date time values sent into the API will be converted to the service timezone.

## Client roles
client `urn:ads:platform:calendar-service`

| name | description |
|:-|:-|
| calendar-admin | Administrator role for calendar service. This role allows a user to read and updated calendar events. |

User access is primary controlled via configuration on each calendar with `updaterRoles` and `readerRoles` representing: the roles that grant update permission; and roles that grand read permission respectively.

## Concepts
### Dates
Calendar service provides informational endpoints for Dates that includes information like which days are business days and which are holidays.

### Calendar
Calender is a container for *events*. Each calender has basic name and description information which is publicly accessible.

### Calendar event
Calender events represent a scheduled activity. Each event has some basic name and description information as well as start and end time. Events can be made public so that anonymous users can read their fields; their attendees remain accessible only to authorized users.

### Attendee
Attendees represent people attending a particular *event*. Blanks attendees (no name or email) can be created to represent available appointment slots.
