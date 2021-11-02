---
layout: page
title: Event service
nav_order: 4
parent: Services
---

# Event service
Event service allows consumers to send domain events. These events can be used to support additional capabilities aside from the application itself; out of the box, the event service logs domain events to the event log which can be used for traceability of domain operations.

## Client roles
client `urn:ads:platform:event-service`

| name | description |
|:-|:-|
| event-sender | Sender role for event service. This role is used to allow a service account to send domain events via the event service. Note that the account with the role will be able to send any domain event including platform defined events. |

## Concepts
### Event definition
Event definition is an optional metadata description of a *domain event* (identified by a specific namespace and name). They are used for downstream capabilities. For example, the payload schema description allows the [notification service](notification-service.md) to validate variables within notification message templates. Event definitions are configured in the [configuration service](configuration-service.md) under the `platform:event-service` namespace and name.

### Event
Domain events represent key changes at a domain model level. For example, an intake application process could include events like: application draft created, application submitted, application processing started, application processing completed.

### Event log
Event log records all *events* emitted via the event service and keeps basic metrics including a count of different events. These metrics can represent key domain metrics; in the intake application example, the count of application submitted events represents the volume of applications.

## Code examples
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
        ...
      }
      applicant: {
        id: 'a8e5ec09-d60a-4c60-94bd-71dc97d8c80e',
        username: 'testy.mctester@acme.com',
      }
    }
  }

  await fetch(
    'https://event-service.alpha.alberta.ca/event/v1/events',
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
  const valueServiceUrl = 'https://value-service.alpha.alberta.ca';
  const top = 50;
  const timestampMin = `2021-10-10T12:00:00Z`;

  const response = await fetch(
    `${valueServiceUrl}/value/v1/event-service/values/event?top=${top}&timestampMin=${timestampMin}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  const {
    results,
    page,
  } = await response.json();
```
