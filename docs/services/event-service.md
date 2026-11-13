---
layout: page
title: Event service
parent: Services
---

# Event service

Event service allows consumers to send domain events. These events can be used to support additional capabilities aside from the application itself; out of the box, the event service logs domain events to the event log which can be used for traceability of domain operations.

## Client roles

client `urn:ads:platform:event-service`

| name         | description                                                                                                                                                                                                                           |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| event-sender | Sender role for event service. This role is used to allow a service account to send domain events via the event service. Note that the account with the role will be able to send any domain event including platform defined events. |
| event-admin  | Administrator role for managing the tenant's event definitions. It is part of the tenant-admin composite role.                                                                                                                        |
| event-reader | Reader role for event service. This role is used to allow users to query the event log, including counting events matching search criteria. It is not part of the tenant-admin composite role.                                        |

Some endpoints also accept roles of other platform services, so that existing accounts keep working:

- Reading event definitions accepts the configuration service `urn:ads:platform:configuration-service:configuration-reader` role as well as `event-admin`.
- Counting events accepts the value service `urn:ads:platform:value-service:value-reader` role as well as `event-reader`.

## Tenancy

- **Tenant users and service accounts** always act on the tenant of their token. A `tenantId` query parameter, or a `tenantId` property in a sent event, is ignored.
- **Core (platform) service accounts** have no tenant of their own. To send an event on behalf of a tenant, they set `tenantId` to the tenant URN, either in the event body (`"tenantId": "urn:ads:platform:tenant-service:v2:/tenants/{id}"`) or as the `tenantId` query parameter; the query parameter takes precedence. Without either, sending an event responds `400`. Platform services such as form service use this to send their events in the tenant they act for.
- **Other endpoints** take the tenant from the `tenantId` query parameter for core users. Counting events and changing event definitions respond `400` without it. Reading event definitions without it returns only core definitions.
- **Event definitions** combine _core_ definitions (registered by platform services for all tenants) with the tenant's own definitions. The definitions API lists both, marked with `isCore`, and can only create, update, or delete tenant definitions. When an event is sent, a core namespace replaces a tenant namespace with the same name, so tenants should use their own namespace names.
- **Events and the event log** are tenant scoped. Subscribers such as notification service only act on an event for the tenant it was sent in, and event counts only include the tenant's events.

## API overview

All endpoints are under `https://event-service.adsp.alberta.ca/event/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                                          | Purpose                                                                  | Required role                                                 |
| :------------------------------------------------ | :----------------------------------------------------------------------- | :------------------------------------------------------------ |
| `POST /event/v1/events`                           | Send a domain event.                                                     | `event-sender`                                                |
| `GET /event/v1/events/count`                      | Count events in the event log matching criteria.                         | `event-reader` or value service `value-reader`                |
| `GET /event/v1/definitions`                       | List tenant and core event definitions.                                  | `event-admin` or configuration service `configuration-reader` |
| `GET /event/v1/definitions/{namespace}/{name}`    | Read one tenant or core event definition.                                | `event-admin` or configuration service `configuration-reader` |
| `POST /event/v1/definitions`                      | Create a tenant event definition.                                        | `event-admin`                                                 |
| `PATCH /event/v1/definitions/{namespace}/{name}`  | Replace the description and payload schema of a tenant event definition. | `event-admin`                                                 |
| `DELETE /event/v1/definitions/{namespace}/{name}` | Delete a tenant event definition.                                        | `event-admin`                                                 |

Event service has no endpoints for reading event log entries. The event log is stored in the [value service](value-service.md) and is searched with the value API (see [Search the event log](#search-the-event-log)).

## Concepts

### Event

Domain events represent key changes at a domain model level. For example, an intake application process could include events like: application draft created, application submitted, application processing started, application processing completed.

An event is identified by its `namespace` and `name` (each 1 to 50 characters), and includes the `timestamp` when it occurred and a `payload` object. An optional `correlationId` and `context` object let receivers match related events; for example, the event log uses them to find the start of an interval.

### Event definition

Event definition is an optional metadata description of a _domain event_ (identified by a specific namespace and name). It includes a description and a `payloadSchema`, which is a JSON schema of the event payload.

- **Payload validation.** When an event is sent and a definition exists for its namespace and name, its payload is validated against the payload schema, and an invalid payload responds `400` without sending the event. Events without a definition are _ad hoc_ events: they are sent and logged without validation.
- **Downstream use.** The payload schema allows the [notification service](notification-service.md) to validate variables within notification message templates.
- **Storage.** Event definitions are stored in the [configuration service](configuration-service.md) under the `platform:event-service` namespace and name, as a map of namespaces that each contain their definitions. They can be managed with the `/event/v1/definitions` endpoints or with the configuration API. Changes may take a few minutes to apply to sent events because the configuration is cached.
- **Platform options.** Core definitions registered by platform services can also set `interval`, to record the duration since an earlier correlated event as a metric, and `log.skip`, to leave the event out of the event log.

### Event log

Event log records all _events_ emitted via the event service and keeps basic metrics including a count of different events. These metrics can represent key domain metrics; in the intake application example, the count of application submitted events represents the volume of applications.

The event log is stored in the [value service](value-service.md) as the `event-service:event` value. After an event is sent, event service writes a value with the event `correlationId`, the event `context` extended with its `namespace`, `name`, and trace ID, and the event `payload` as `value.payload`. Each entry adds to the `total:count` and `<namespace>:<name>:count` metrics. Events in the `value-service` namespace, and events whose definition sets `log.skip`, are not logged. Logging happens asynchronously, so an event appears in the log shortly after it is sent.

In the tenant management app, the Event log page initially searches **Last 7 days**, covering the preceding 168 hours through the current time, with both UTC timestamp boundaries included in the API request. The date range filter also offers **Last hour**, **Today**, **Last 24 hours**, **Last 30 days**, and **Custom**. Today starts at midnight in Mountain Time (`America/Edmonton`, including daylight saving time). Rolling periods cover the indicated number of elapsed hours or 24-hour days, ending when Search is clicked.

Select a period and click **Search** to apply it along with any other filters. Start and end date/time controls display the selected period in Mountain Time. They are disabled for predefined periods and editable for **Custom**, initially filled with the selected period. The end must be later than the start. **Reset** clears other filters and immediately searches Last 7 days again. Removing the date range chip clears the selected period and searches without a lower date limit, retaining other applied filters. Pagination pins an upper timestamp at search time so new events do not shift the result pages or count. Search is disabled when no criteria are selected. An empty result displays **No Events Found**.

### Access service audit

Event service also records security-sensitive `access-service` (Keycloak) events in the [audit service](audit-service.md). See [access service audit actions](access-service.md#audit-actions).

## Events

Event service does not define domain events of its own. It routes the events sent to it over RabbitMQ to subscribers, such as the [notification service](notification-service.md) and the [push service](push-service.md).

It consumes:

- every sent domain event, to write it to the event log;
- `access-service` events, to record audit entries in the [audit service](audit-service.md);
- configuration update notifications, to clear its cached configuration, including event definitions.

## Code examples

### Create an event definition

```typescript
const eventServiceUrl = 'https://event-service.adsp.alberta.ca';

const response = await fetch(`${eventServiceUrl}/event/v1/definitions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    namespace: 'support-program',
    name: 'application-submitted',
    description: 'Signalled when an application is submitted.',
    payloadSchema: {
      type: 'object',
      properties: {
        application: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
      required: ['application'],
    },
  }),
});

const { namespace, name, isCore } = await response.json();
```

Send `description: null` when there is no description. A definition that already exists responds `409`; use `PATCH /event/v1/definitions/{namespace}/{name}` to change it.

### Configure an event definition

Event definitions can also be configured using the [configuration service](configuration-service.md). Note that new configuration may take up to 15 mins to apply.

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
  context: {},
  payload: {
    application: {
      id: 'f669be59-bd38-4ca4-8749-19248060fc63',
      /* ... */
    },
    applicant: {
      id: 'a8e5ec09-d60a-4c60-94bd-71dc97d8c80e',
      username: 'testy.mctester@acme.com',
    },
  },
};

const response = await fetch('https://event-service.adsp.alberta.ca/event/v1/events', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(event),
});

// 200 when sent; 400 with an errorMessage when the payload does not match the event definition.
const sent = response.ok;
```

### Send an event on behalf of a tenant

A core (platform) service account sets the tenant of the event with `tenantId`. Tenant service accounts don't need it.

```typescript
await fetch('https://event-service.adsp.alberta.ca/event/v1/events', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${coreServiceAccountToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7',
    namespace: 'support-program',
    name: 'application-submitted',
    timestamp: new Date().toISOString(),
    payload: { application: { id: 'f669be59-bd38-4ca4-8749-19248060fc63' } },
  }),
});
```

Platform services built with the [Node.js SDK](../platform/platform-node-sdk.md) register their events with the `events` option of `initializePlatform`, which makes them core event definitions, and send them with the SDK `eventService`, which sets `tenantId` in the body for core services.

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

Use `payload` for JSON containment. When the object contains multiple conditions, every condition must match
(`AND`). The event payload may have additional properties beyond those supplied:

```typescript
const parameters = new URLSearchParams({
  timestampMin: '2026-10-01T00:00:00Z',
  timestampMax: '2026-10-02T00:00:00Z',
  payload: JSON.stringify({ applicationId: '12345', status: 'submitted' }),
});
```

The two payload search forms cannot be combined. They can be combined with the existing tenant, event context,
correlation ID, and timestamp filters; all filters are combined using `AND`. Payload searches use JSONB containment
without an additional payload index.

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
