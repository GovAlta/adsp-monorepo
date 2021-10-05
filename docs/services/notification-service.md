---
layout: page
title: Notification service
nav_order: 8
parent: Services
---

# Notification service
Notification service provides the ability to generate and send notifications based on domain events sent via the event service. This service also includes a concept of subscriptions and subscribers to support management of subscriber preferences and unsubscribe.

## Client roles
client `urn:ads:platform:file-service`

| name | description |
|:-|:-|
| subscription-admin | Administrator role for notification service subscriptions. This role grants read and write of subscriptions. For example, a user with this role can remove subscriptions and delete subscribers.  |

### Concepts
## Notification type
Notification type represents a bundled set of notifications that can be subscribed to and provides the access roles for that set. For example, a 'Application Progress' type could include notifications for submission of the application, processing started, and application processed. A subscriber has a subscription to the set and cannot subscribe to the individual notifications in the set.

### Notification
A notification is a specific communication sent to a subscriber. It contains a message and is send to an address via a specific channel.

## Subscriber
A subscriber represents a receiver of notifications. Subscriber is not a representation of a specific person; i.e. a person may have distinct subscribers for notifications for traffic tickets versus for grants. Subscribers also do not necessarily have distinct emails or phone numbers and it is up to the consuming application to determine how subscribers are used in their domain.

## Subscription
*Subscribers* have subscriptions to *notification types*. Each subscription relates a subscriber to a notification type and optionally includes criteria. The subscription criteria filters events that result in notifications to the associated subscriber. For example, in the case of 'Application Progress', the applicant is only subscribed to notifications regarding their specific application and this is handled as a subscription criteria.

