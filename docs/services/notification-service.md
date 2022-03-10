---
layout: page
title: Notification service
nav_order: 8
parent: Services
---

# Notification service
Notification service provides the ability to generate and send notifications based on domain events sent via the [event service](event-service.md). This service also includes a concept of subscriptions and subscribers to support management of subscriber preferences and unsubscribe.

*Subscribers* and *subscriptions* fall broadly into two categories: self-managed and application managed. Authenticated users with a subscriber role may subscribe to, managed, and unsubscribe from notifications based on their own access permissions; in this case the *subscriber* is associated with the user. Alternatively, applications can manage *subscriptions* under service account credentials and in this case the application determines the management actions available to the *subscriber*.

## Client roles
client `urn:ads:platform:notification-service`

| name | description |
|:-|:-|
| subscription-admin | Administrator role for notification service subscriptions. This role grants read and write of subscriptions. For example, a user with this role can remove subscriptions and delete subscribers.  |
| subscription-app | Subscription application role for the notification service. This role is used to grant service accounts permission to manage subscribers and subscriptions.  |

## Concepts
### Notification type
Notification type represents a bundled set of notifications that can be subscribed to and provides the access roles for that set. For example, an 'Application Progress' type could include notifications for submission of the application, processing started, and application processed. A subscriber has a subscription to the set and cannot subscribe to the individual notifications in the set. Notification types are configured in the [configuration service](configuration-service.md) under the `platform:notification-service` namespace and name.

### Notification
A notification is a specific communication sent to a subscriber. It contains a message and is send to an address via a specific channel.

### Subscriber
A subscriber represents a receiver of notifications. Subscriber is not a representation of a specific person; i.e. a person may have distinct subscribers for notifications for traffic tickets versus for grants. Subscribers also do not necessarily have distinct emails or phone numbers and it is up to the consuming application to determine how subscribers are used in their domain.

### Subscription
*Subscribers* have subscriptions to *notification types*. Each subscription relates a subscriber to a notification type and optionally includes criteria. The subscription criteria filters events that result in notifications to the associated subscriber. For example, in the case of 'Application Progress', the applicant is only subscribed to notifications regarding their specific application and this is handled as a subscription criteria.

## Code examples
### Configure a stream
Notification types are configured using the [configuration service](configuration-service.md).

```typescript
  const configurationServiceUrl = 'https://configuration-service.alpha.alberta.ca';
  const request = {
    operation: 'UPDATE',
    update: {
      'application-health-updates': {
        id: 'application-health-updates',
        name: 'Application Health Updates',
        description: 'Provides notification of changes on application health checks.',
        publicSubscribe: true,
        subscriberRoles: [],
        channels: ['email'],
        events: [
          {
            namespace: 'status-service',
            name: 'health-check-started',
            templates: {
              email: {
                subject: '{{ event.payload.application.name }} Health Check Started',
                body: 'Application health check started for {{ event.payload.application.name }}.',
              }
            },
          }
        ],
      }
    }
  }

  await fetch(
    `${configurationServiceUrl}/configuration/v1/configuration/platform/notification-service`,
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

### Subscribe to a notification type for the current user
Users can create a subscription for themselves and user details from the access token, like user email address, are used to populate the subscriber. A subscriber is created if there is no existing subscriber associated with the user ID.

For this type of subscription request, the user must have a subscriber role.

```typescript
  const response = await fetch(
    `https://notification-service.alpha.alberta.ca/subscription/v1/types/${typeId}/subscriptions?userSub=true`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        criteria: {
          correlationId,
          context,
        },
      }),
    }
  );

  const {
    typeId,
    subscriber,
    criteria,
  } = await response.json();
```

### Update subscriber (notification preferences)
Users can update their subscriber preferences including the channels of notification. The order of channels represents the preferred channels for notifications.

```typescript
  const response = await fetch(
    `https://notification-service.alpha.alberta.ca/subscription/v1/subscribers/${subscriberId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addressAs: 'A.N.Other',
        channels: [
          {
            channel: 'email',
            address: 'a.n.other@acme.org',
          }
        ]
      }),
    }
  );

  const {
    id,
    addressAs,
    channels,
  } = await response.json();
```

### Unsubscribe from a notification type
```typescript
  const response = await fetch(
    `https://notification-service.alpha.alberta.ca/subscription/v1/types/${typeId}/subscriptions/${subscriberId}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  const { deleted } = await response.json();
```
