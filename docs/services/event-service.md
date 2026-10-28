---
layout: page
title: Event service
nav_order: 5
parent: Services
---

# Event service

Event service allows consumers to send domain events. These events can be used to support additional capabilities aside from the application itself; out of the box, the event service logs domain events to the event log which can be used for traceability of domain operations.

## Client roles

client `urn:ads:platform:event-service`

| name         | description                                                                                                                                                                                                                           |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| event-sender | Sender role for event service. This role is used to allow a service account to send domain events via the event service. Note that the account with the role will be able to send any domain event including platform defined events. |
| event-reader | Reader role for event service. This role is used to allow users to query the event log, including counting events matching search criteria. It is part of the tenant-admin composite role.                                            |

## Concepts

### Event definition

Event definition is an optional metadata description of a _domain event_ (identified by a specific namespace and name). They are used for downstream capabilities. For example, the payload schema description allows the [notification service](notification-service.md) to validate variables within notification message templates. Event definitions are configured in the [configuration service](configuration-service.md) under the `platform:event-service` namespace and name.

### Event

Domain events represent key changes at a domain model level. For example, an intake application process could include events like: application draft created, application submitted, application processing started, application processing completed.

### Event log

Event log records all _events_ emitted via the event service and keeps basic metrics including a count of different events. These metrics can represent key domain metrics; in the intake application example, the count of application submitted events represents the volume of applications.

In the tenant management app, the Event log page initially searches **Last 7 days**, covering the preceding 168 hours through the current time, with both UTC timestamp boundaries included in the API request. The date range filter also offers **Last hour**, **Today**, **Last 24 hours**, **Last 30 days**, and **Custom**. Today starts at midnight in Mountain Time (`America/Edmonton`, including daylight saving time). Rolling periods cover the indicated number of elapsed hours or 24-hour days, ending when Search is clicked.

Select a period and click **Search** to apply it along with any other filters. Start and end date/time controls display the selected period in Mountain Time. They are disabled for predefined periods and editable for **Custom**, initially filled with the selected period. The end must be later than the start. **Reset** clears other filters and immediately searches Last 7 days again. Removing the date range chip clears the selected period and searches without a lower date limit, retaining other applied filters. Pagination pins an upper timestamp at search time so new events do not shift the result pages or count. Search is disabled when no criteria are selected. An empty result displays **No Events Found**.

## Code examples

### Configure an event definition

Event definitions are configured using the [configuration service](configuration-service.md). Note that new configuration may take up to 15 mins to apply.

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
const request = {
  operation: 'UPDATE',
  update: {
    'domain-service': {
      name: 'domain-service',
      definitions: {
        'domain-event': {
          name: 'domain-event',
          description: 'Signalled on significant domain state change.',
          payloadSchema: {
            type: 'object',
            properties: {
              value: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

await fetch(`${configurationServiceUrl}/configuration/v2/configuration/platform/event-service`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

### Send an event

```typescript
  const event = {
    namespace: 'support-program',
    name: 'application-submitted',
    timestamp: '2021-10-12T15:03:50Z',
    correlationId: 'f669be59-bd38-4ca4-8749-19248060fc63',
    context: {
    },
    payload: {
      application: {
        id: 'f669be59-bd38-4ca4-8749-19248060fc63',
        /* ... */
      }
      applicant: {
        id: 'a8e5ec09-d60a-4c60-94bd-71dc97d8c80e',
        username: 'testy.mctester@acme.com',
      }
    }
  }

  await fetch(
    'https://event-service.adsp.alberta.ca/event/v1/events',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );
```

### Search the event log

The event log is stored as a value (event-service:event) in the [value service](value-service.md) and can be queried using the value API.

```typescript
const valueServiceUrl = 'https://value-service.adsp.alberta.ca';
const top = 50;
const timestampMin = `2021-10-10T12:00:00Z`;

const response = await fetch(
  `${valueServiceUrl}/value/v1/event-service/values/event?top=${top}&timestampMin=${timestampMin}`,
  {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

const { results, page } = await response.json();
```

Event payloads can be searched within a bounded timestamp range. Use `payloadPath` with `payloadValue` for an
exact scalar match at a dot-separated path:

```typescript
const parameters = new URLSearchParams({
  timestampMin: '2026-10-01T00:00:00Z',
  timestampMax: '2026-10-02T00:00:00Z',
  payloadPath: 'applicant.contact.email',
  payloadValue: 'jane@example.gov.ab.ca',
});

const response = await fetch(`${valueServiceUrl}/value/v1/event-service/values/event?${parameters}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

Unquoted values that are valid JSON scalars are matched using their JSON type, so `123`, `true`, and `null` match
a number, boolean, and null respectively. JSON-quote a string that would otherwise parse as another scalar type.

Use `payload` for JSON containment. The event payload may have additional properties beyond those supplied:

```typescript
const parameters = new URLSearchParams({
  timestampMin: '2026-10-01T00:00:00Z',
  timestampMax: '2026-10-02T00:00:00Z',
  payload: JSON.stringify({ applicationId: '12345', status: 'submitted' }),
});
```

The two payload search forms cannot be combined. They can be combined with the existing tenant, event context,
correlation ID, and timestamp filters. Payload searches use JSONB containment without an additional payload index.

### Count events in the event log

The count of events matching the event log search criteria is available directly from the event service, so
consumers do not need to use the value API. Namespace and name are each optional and independent of one another;
other supplied criteria (timestamp range, correlation ID) are combined with namespace and name when determining
the count.

```typescript
const eventServiceUrl = 'https://event-service.adsp.alberta.ca';
const timestampMin = `2021-10-10T12:00:00Z`;

const response = await fetch(
  `${eventServiceUrl}/event/v1/events/count?namespace=application-events&timestampMin=${timestampMin}`,
  {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

const { count } = await response.json();
```
