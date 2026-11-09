---
layout: page
title: Push service
nav_order: 7
parent: Services
---

# Push service

## Overview

Push service provides a push mode gateway to domain events sent through the [event service](event-service.md). Applications subscribe to a configured stream and receive matching events as they happen, using [socket.io](https://socket.io) or server-sent events, instead of polling.

The push service also calls tenant configured webhooks when matching domain events occur.

## Client roles

client `urn:ads:platform:push-service`

| name            | description                                                                                                                           |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| stream-listener | Allows an account to subscribe to any stream of its tenant, including streams that are not public. Included in the tenant admin role. |

Access to each stream is mainly controlled by the stream's configuration: `publicSubscribe` lets anyone subscribe, including anonymous users, and `subscriberRoles` lists the roles that grant access in addition to `stream-listener`. Roles must be held in the stream's tenant, or by a core (platform) user.

## Tenancy

Streams and webhooks are configured per tenant in the [configuration service](configuration-service.md) under `platform:push-service`. Platform streams in the core configuration are also available to every tenant. When a tenant and the core configuration have a stream with the same ID, the core stream is used. A core stream used in a tenant's context only includes that tenant's events.

Which tenant a request acts on depends on how the caller connects:

| Connection                        | Tenant used                                                                                                                          |
| :-------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| `GET /stream/v1/streams`          | The `tenant` query parameter (tenant ID, for example `61f2e3a8c9b1d2e3f4a5b6c7`) if set, otherwise the tenant of the caller's token. |
| `GET /stream/v1/streams/{stream}` | The tenant named in the `tenant` query parameter (kebab case, for example `my-tenant`) if it exists, otherwise the token's tenant.   |
| socket.io tenant namespace        | The tenant named by the namespace (kebab case, for example `/my-tenant`) if it exists, otherwise the token's tenant.                 |
| socket.io default namespace (`/`) | The tenant of the caller's token.                                                                                                    |

- Anonymous callers must name a tenant, and can only list and subscribe to public streams. A request with no tenant responds 400, or fails to connect on socket.io.
- Tenant users and service accounts can name another tenant, but can only subscribe to its public streams, since roles must be held in the stream's tenant.
- A core user who doesn't name a tenant subscribes to a **cross-tenant** stream from the core configuration. It includes matching events from every tenant, and needs the `stream-listener` role or one of the stream's `subscriberRoles`. Listing streams always needs a tenant.
- Streams of other tenants are only found when that tenant is named. Otherwise the stream responds 404.

## API overview

See the [API reference](https://api.adsp.alberta.ca) for request and response details of the REST endpoints.

| Endpoint                              | Description                                        | Required roles                                                      |
| :------------------------------------ | :------------------------------------------------- | :------------------------------------------------------------------ |
| `GET /stream/v1/streams`              | List the streams that the caller can subscribe to. | None. The result only includes streams the caller can subscribe to. |
| `GET /stream/v1/streams/{stream}`     | Subscribe to a stream using server-sent events.    | `stream-listener` or one of `subscriberRoles`, or a public stream.  |
| socket.io connection (not in OpenAPI) | Subscribe to a stream using socket.io.             | `stream-listener` or one of `subscriberRoles`, or a public stream.  |

The socket.io connection is not a REST endpoint, so it isn't in the OpenAPI documentation. It works as follows:

- **URL**: `https://push-service.adsp.alberta.ca/<namespace>` with the default socket.io path (`/socket.io`). The namespace is `/` (the default namespace), or a tenant name in kebab case, for example `/my-tenant`.
- **Stream ID**: the `stream` query parameter of the connection. An optional `criteria` query parameter holds JSON encoded criteria (`correlationId`, `context`) that each event must match.
- **Authentication**: send the access token in the socket.io `auth` option as `{ token }`, or in an `Authorization: Bearer` header. The default namespace needs a valid token. Tenant namespaces also accept anonymous connections, for public streams.
- **Events**: each matching domain event is emitted with the event name `<namespace>:<name>` (for example `status-service:health-check-started`). The event data is the stream item: the domain event, or the stream's projection of it, with `tenantId` as the tenant URN.
- **Errors**: when there is no tenant, the stream doesn't exist, or the caller can't subscribe, the connection fails and the client receives a `connect_error` with the error message.

Streams and webhooks have no endpoints in the push service. They are managed through the [configuration service](configuration-service.md).

## Concepts

### Stream

A stream is a set of domain events that clients can subscribe to through the gateway. Each stream event identifies a domain event by `namespace` and `name`, and can have:

- `criteria`: a `correlationId` and `context` values that the event must match to be included.
- `map`: a projection of the event, so that clients only receive a subset of the payload. Each key is a property of the stream item and each value is a path into the domain event, for example `payload.application.name`. Mapped items always include `tenantId`, `namespace`, `name`, `correlationId` and `context`.

Streams are configured in the [configuration service](configuration-service.md) under the `platform:push-service` namespace and name. Each stream is a top level key of the configuration, with its ID as the key.

### Webhook

A webhook is a URL that the push service posts a domain event to when the event matches the webhook's `events`. Webhooks are configured under the `webhooks` key of the same configuration. Webhooks with a `targetId` and `eventTypes` are application status webhooks, triggered by [status service](status-service.md) events for that application; see the [webhooks tutorial](../tutorials/status-service/webhooks.md).

## Events

The push service consumes every domain event routed by the [event service](event-service.md), and sends matching events to stream subscribers and webhooks.

It sends this domain event:

| Event                          | Description                                                                                                                             |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| push-service:webhook-triggered | Signalled when a webhook is called. The payload includes the webhook, the triggering event, the response status, and the response time. |

## Code examples

### Configure a stream

Streams are configured using the [configuration service](configuration-service.md).

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
const request = {
  operation: 'UPDATE',
  update: {
    'application-health': {
      id: 'application-health',
      name: 'Application Health',
      description: 'Includes events indicating application health.',
      publicSubscribe: true,
      subscriberRoles: [],
      events: [
        {
          namespace: 'status-service',
          name: 'health-check-started',
          map: {
            // Optional projection of the event, for example:
            application: 'payload.application.name',
          },
          criteria: {
            // Optional criteria for events included in the stream.
          },
        },
      ],
    },
  },
};

await fetch(`${configurationServiceUrl}/configuration/v2/configuration/platform/push-service`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

### List available streams

```typescript
const response = await fetch('https://push-service.adsp.alberta.ca/stream/v1/streams', {
  headers: { Authorization: `Bearer ${accessToken}` },
});
// Streams keyed by ID, for example { 'application-health': { id, name, description, events, ... } }
const streams = await response.json();
const streamIds = Object.keys(streams);
```

### Connect to a stream via socket.io

Socket.io connections to the default namespace act on the tenant of the access token. Use a tenant namespace, for example `/my-tenant`, to connect anonymously to a public stream.

```typescript
import { io } from 'socket.io-client';

const socket = io('https://push-service.adsp.alberta.ca/', {
  query: {
    stream: 'application-health',
    // Optional criteria the events must match.
    criteria: JSON.stringify({ context: { applicationId: '64b1f2e3a8c9b1d2e3f4a5b6' } }),
  },
  withCredentials: true,
  auth: async (cb) => cb({ token: await getAccessToken() }),
});

socket.on('status-service:health-check-started', (item) => {
  // Stream item, for example { tenantId, namespace, name, correlationId, context, application }.
  console.log(item.name, item.application);
});

socket.on('connect_error', (err) => {
  // For example, the stream does not exist or the user cannot subscribe.
  console.error(err.message);
});
```

### Connect to a stream via server-sent events

Browser `EventSource` cannot set an `Authorization` header, so use an `EventSource` polyfill that supports headers (as below), or use socket.io. Anonymous callers can subscribe to a public stream without a token by naming the tenant, for example `?tenant=my-tenant`.

```typescript
import { EventSourcePolyfill } from 'event-source-polyfill';

const eventSource = new EventSourcePolyfill(
  'https://push-service.adsp.alberta.ca/stream/v1/streams/application-health',
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);
eventSource.onmessage = function (e) {
  // Each message is a JSON stream item.
  const item = JSON.parse(e.data);
  console.log(`${item.namespace}:${item.name}`, item.correlationId);
};
eventSource.onerror = function (err) {
  // On error.
};
```
