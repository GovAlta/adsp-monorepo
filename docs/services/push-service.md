---
layout: page
title: Push service
nav_order: 7
parent: Services
---

# Push service
Push service provides push mode gateway to events emitted in the [event service](event-service.md). It supports server side events and web sockets via [socket.io](https://socket.io).

Note that the web socket and socket.io endpoints are not part of the RESTful API and are not included in the Open API documentation for the service.

## Client roles
client `urn:ads:platform:push-service`

| name | description |
|:-|:-|
| stream-listener | Stream listener role for push service. This role is used to allow an account to subscribe to any stream.  |

User access is primary controlled via configuration on each stream with `subscriberRoles` representing the roles that grant read permission.

## Concepts
### Stream
Stream represents a collection of domain events that can be subscribed to through the gateway. Streams can optionally include projections for the events, so that only a subset of the payload is provided to the subscribing clients. Streams are configured in the [configuration service](configuration-service.md) under the `platform:push-service` namespace and name.

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
              // Optional configuration of the projection of the event.
            },
            criteria: {
              // Optional criteria for events included in the stream.
            }
          }
        ],
      }
    }
  }

  await fetch(
    `${configurationServiceUrl}/configuration/v2/configuration/platform/push-service`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
    }
  );
```

### Connect to a stream via server side events
Server side event with Authorization header may require a polyfill. Alternatively, use a token query parameter to provide the access token.

```typescript
  const eventSource = new EventSource(
    `https://push-service.adsp.alberta.ca/stream/v1/streams/${streamId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  eventSource.onmessage = function(e) {
    // on message
  }
  eventSource.onerror = function(err) {
    // on error
  }
```

### Connect to a stream via socket.io
Socket.io connections use namespaces for tenancy. Each connection is made to a specific tenant.

```typescript
  import { io } from 'socket.io-client';
  const socket = io(
    `https://push-service.adsp.alberta.ca/${tenantId}?stream=${streamId}`,
    {
      withCredentials: true,
      extraHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  socket.on(`${eventNamespace}:${eventName}`, (event) => {
    // Handle the event.
  });
```
