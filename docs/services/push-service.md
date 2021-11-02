---
layout: page
title: Push service
nav_order: 6
parent: Services
---

# Push service
Push service provides push mode gateway to events emitted in the [event service](event-service.md). It supports server side events and web sockets.

## Client roles
client `urn:ads:platform:push-service`

Push service does not include any default client roles.

User access is primary controlled via configuration on each stream with `subscriberRoles` representing the roles that grant read permission.

## Concepts
### Stream
Stream represents a collection of domain events that can be subscribed to through the gateway. Streams can optionally include projections for the events, so that only a subset of the payload is provided to the subscribing clients. Streams are configured in the [configuration service](configuration-service.md) under the `platform:push-service` namespace and name.

## Code examples
### Connect to a stream via web sockets
TODO: Add example here

### Connect to a stream via server side events
Server side event with Authorization header may require a pollyfill. Alternatively, use a token query parameter to provide the access token.

```typescript
  const eventSource = new EventSource(
    `https://push-service.alpha.alberta.ca/stream/v1/streams/${streamId}`,
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
