---
layout: page
title: Notification service
nav_order: 9
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
| code-sender | Role for service accounts that send and check verification codes for any subscriber of the tenant. It does not allow verifying the channel. |

The `configuration-admin` role of the [configuration service](configuration-service.md) can also manage notification types and the tenant contact.

## Tenancy
Every notification service resource belongs to one tenant. Notification types, subscribers, subscriptions, and the contact information are all stored and read per tenant.

- **Tenant users and service accounts** always act on the tenant of their token. Any `tenantId` query parameter is ignored.
- **Core (platform) users and service accounts** have no tenant of their own, so they must set the `tenantId` query parameter (for example, `?tenantId=urn:ads:platform:tenant-service:v2:/tenants/{id}`). Endpoints that change configuration (`/types` writes and `/contact`) respond `400` when there is no tenant context. Other endpoints may fail without a clear error, so always include it. Only operations on a specific subscriber (`/subscribers/{subscriber}` and its sub-paths) can find the subscriber without it.
- **Notification types** combine *platform* types (configured by ADSP for all tenants) with the tenant's own types. A tenant type with the same ID as a platform type is a *customization*: only its event templates replace the platform templates. Use `GET /types?source=tenant` or `GET /types?source=core` to see the definitions separately.
- **Subscribers and subscriptions** are never shared across tenants. The same person subscribing in two tenants has two subscribers. A subscriber ID from one tenant responds `404` in another.
- **Events** trigger notifications only for the tenant that sent the event. A platform type that includes an event generates notifications for subscribers of the tenant the event was sent for.

## API overview
All endpoints are under `https://notification-service.adsp.alberta.ca/subscription/v1` and require a bearer token. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Area | Endpoints | Required role |
|:-|:-|:-|
| Notification types and templates | `GET /types`, `GET /types/{type}` | Any authenticated user |
| | `GET /types?source=tenant\|core`, `POST /types`, `PATCH /types/{type}`, `DELETE /types/{type}` | subscription-admin or configuration-admin |
| Contact | `GET /contact`, `PATCH /contact` | subscription-admin or configuration-admin |
| Subscriptions | `GET /types/{type}/subscriptions` | subscription-admin or subscription-app |
| | `POST /types/{type}/subscriptions`, `POST\|DELETE /types/{type}/subscriptions/{subscriber}`, `DELETE /types/{type}/subscriptions/{subscriber}/criteria` | subscription-admin, subscription-app, or the subscriber's own user when the type allows it |
| | `GET /types/{type}/subscriptions/{subscriber}` | subscription-admin |
| Subscribers (recipients) | `GET /subscribers` | subscription-admin |
| | `POST /subscribers`, `GET\|PATCH\|DELETE /subscribers/{subscriber}`, `GET /subscribers/{subscriber}/subscriptions`, `GET /subscribers/{subscriber}/types/{type}/channels` | subscription-admin, subscription-app, or the subscriber's own user |
| | `POST /subscribers/{subscriber}` (verification operations) | As above, or code-sender for `send-code`, `send-code-with-link`, and `check-code` |
| | `GET /subscribers/my-subscriber` | Any authenticated user |

There are no separate template or event endpoints. Templates are part of each notification type's `events`, and events are sent through the [event service](event-service.md).

## Concepts
### Notification type
Notification type represents a bundled set of notifications that can be subscribed to and provides the access roles for that set. For example, an 'Application Progress' type could include notifications for submission of the application, processing started, and application processed. A subscriber has a subscription to the set and cannot subscribe to the individual notifications in the set. Notification types are configured in the [configuration service](configuration-service.md) under the `platform:notification-service` namespace and name.

### Notification
A notification is a specific communication sent to a subscriber. It contains a message and is send to an address via a specific channel.

### Subscriber
A subscriber represents a receiver of notifications. Subscriber is not a representation of a specific person; i.e. a person may have distinct subscribers for notifications for traffic tickets versus for grants. Subscribers also do not necessarily have distinct emails or phone numbers and it is up to the consuming application to determine how subscribers are used in their domain.

### Subscription
*Subscribers* have subscriptions to *notification types*. Each subscription relates a subscriber to a notification type and optionally includes criteria. The subscription criteria filters events that result in notifications to the associated subscriber. For example, in the case of 'Application Progress', the applicant is only subscribed to notifications regarding their specific application and this is handled as a subscription criteria.

### Template
Each event of a notification type has a template per channel (`email`, `sms`, `bot`, `mail`), with a `subject` and `body`. Templates use [Handlebars](https://handlebarsjs.com/) syntax, and email bodies are wrapped in the standard email layout. The following values are available in templates:

| Value | Description |
|:-|:-|
| `event` | The triggering domain event, including `namespace`, `name`, `timestamp`, `correlationId`, `context`, and `payload`. |
| `subscriber` | The subscriber's `id`, `userId`, and `addressAs`. |
| `tenant` | The tenant the event was sent for, including `name`. |
| `managementUrl` | Link to the subscriber app, where the subscriber can manage their subscriptions. |

## Events
Notifications are triggered by domain events from other services. A notification type lists the events (`namespace` and `name`) that it sends notifications for. Events in the `notification-service` namespace never trigger notifications, to avoid loops.

The notification service sends the following domain events under the `notification-service` namespace:

| Event | Description |
|:-|:-|
| `notifications-generated` | Notifications were generated for an event. |
| `notification-generation-failed` | Generation of notifications for an event failed. |
| `notification-sent` | A notification was sent. |
| `notification-send-failed` | Sending a notification failed. |
| `notification-config-retried` | Generation retried reading configuration because the tenant's from email was not yet set. |
| `subscriber-created` | A subscriber was created. |
| `subscriber-updated` | A subscriber was updated, including verification of a channel. |
| `subscriber-deleted` | A subscriber was deleted. |
| `subscription-set` | A subscription was created or its criteria changed. |
| `subscription-deleted` | A subscription was deleted. |

## Code examples
### Create a notification type
Users with the subscription-admin or configuration-admin role can create notification types for their tenant. The definition is validated, including its channels, events, and templates. The service responds `409` if a type with the ID already exists.

```typescript
  const response = await fetch(
    'https://notification-service.adsp.alberta.ca/subscription/v1/types',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'application-status',
        name: 'Application status',
        description: 'Notifications about changes to an application.',
        manageSubscribe: true,
        publicSubscribe: false,
        subscriberRoles: ['applicant'],
        channels: ['email'],
        events: [
          {
            namespace: 'application-service',
            name: 'application-status-changed',
            templates: {
              email: {
                subject: 'Your application status changed',
                body: '<p>Hi {{ subscriber.addressAs }}, your application is now {{ event.payload.status }}.</p>',
              },
            },
          },
        ],
      }),
    }
  );

  const { id, events } = await response.json();
```

### Customize a platform notification type template
Updating a platform type saves a tenant customization of it. Only the event templates in the customization apply. Deleting the customization with `DELETE /types/{type}` reverts to the platform templates.

```typescript
  await fetch(
    'https://notification-service.adsp.alberta.ca/subscription/v1/types/application-health-updates',
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: [
          {
            namespace: 'status-service',
            name: 'health-check-started',
            templates: {
              email: {
                subject: '{{ event.payload.application.name }} is being monitored',
                body: '<p>Health checks started for {{ event.payload.application.name }}.</p>',
              },
            },
          },
        ],
      }),
    }
  );
```

### Act on a tenant as a platform service account
Core service accounts set the `tenantId` query parameter on every request.

```typescript
  const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7';
  const response = await fetch(
    `https://notification-service.adsp.alberta.ca/subscription/v1/types?tenantId=${encodeURIComponent(tenantId)}`,
    { headers: { 'Authorization': `Bearer ${coreAccessToken}` } }
  );

  const types = await response.json();
```

### Configure a notification type in the configuration service
Notification types are configured using the [configuration service](configuration-service.md).

```typescript
  const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
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
    `${configurationServiceUrl}/configuration/v2/configuration/platform/notification-service`,
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
    `https://notification-service.adsp.alberta.ca/subscription/v1/types/${typeId}/subscriptions?userSub=true`,
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

### Subscribe a subscriber from an application
Service accounts with the subscription-app role can subscribe anyone. A subscriber is created if no subscriber exists for the `userId` (or `id`) in the request.

```typescript
  const response = await fetch(
    `https://notification-service.adsp.alberta.ca/subscription/v1/types/${typeId}/subscriptions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        addressAs: 'A.N.Other',
        channels: [{ channel: 'email', address: 'a.n.other@acme.org' }],
        criteria: { correlationId: 'application-1234' },
      }),
    }
  );

  const { subscriberId, criteria } = await response.json();
```

### Find subscriptions to a notification type
Service accounts can check whether anyone is subscribed before sending an event. Results are paged; pass `page.next` as `after` to get the next page.

```typescript
  const subscriptionMatch = encodeURIComponent(JSON.stringify({ correlationId: 'application-1234' }));
  const response = await fetch(
    `https://notification-service.adsp.alberta.ca/subscription/v1/types/${typeId}/subscriptions?top=50&subscriptionMatch=${subscriptionMatch}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  const { results, page } = await response.json();
```

### Remove one subscription criteria
Removes the criteria that match. The subscription is deleted when its last criteria is removed.

```typescript
  const criteria = encodeURIComponent(JSON.stringify({ correlationId: 'application-1234' }));
  const response = await fetch(
    `https://notification-service.adsp.alberta.ca/subscription/v1/types/${typeId}/subscriptions/${subscriberId}/criteria?criteria=${criteria}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  const { deleted } = await response.json();
```

### Get the current user's subscriber
```typescript
  const response = await fetch(
    'https://notification-service.adsp.alberta.ca/subscription/v1/subscribers/my-subscriber?includeSubscriptions=true',
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  const { id, channels, subscriptions } = await response.json();
```

### Search subscribers
Users with the subscription-admin role can search subscribers of their tenant by name, email, or SMS number.

```typescript
  const response = await fetch(
    'https://notification-service.adsp.alberta.ca/subscription/v1/subscribers?search=other&sortBy=created&sortDirection=desc',
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  const { results, page: { total, next } } = await response.json();
```

### Verify a subscriber channel
Send a code to the channel address, then verify the channel with the code the subscriber received.

```typescript
  const subscriberUrl = `https://notification-service.adsp.alberta.ca/subscription/v1/subscribers/${subscriberId}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  await fetch(subscriberUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operation: 'send-code',
      channel: 'email',
      address: 'a.n.other@acme.org',
      reason: 'Verify your email address.',
    }),
  });

  const response = await fetch(subscriberUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operation: 'verify-channel',
      channel: 'email',
      address: 'a.n.other@acme.org',
      code,
    }),
  });

  const { verified } = await response.json();
```

### Update subscriber (notification preferences)
Users can update their subscriber preferences including the channels of notification. The order of channels represents the preferred channels for notifications.

```typescript
  const response = await fetch(
    `https://notification-service.adsp.alberta.ca/subscription/v1/subscribers/${subscriberId}`,
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
    `https://notification-service.adsp.alberta.ca/subscription/v1/types/${typeId}/subscriptions/${subscriberId}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  const { deleted } = await response.json();
```
