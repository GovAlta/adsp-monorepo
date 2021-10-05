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
Event definition is an optional metadata descriptions of a domain *event* (identified by a specific namespace and name). They are used for downstream capabilities. For example, the payload schema description allows the notification service to validate variables within notification message templates.

### Event
Domain events represent key changes at a domain model level. For example, an intake application process could include events like: application draft created, application submitted, application processing started, application processing completed.

### Event log
Event log records all *events* emitted via the event service and keeps basic metrics including a count of different events. These metrics can represent key domain metrics; in the intake application example, the count of application submitted events represents the volume of applications.
