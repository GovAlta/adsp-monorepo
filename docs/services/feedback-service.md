---
layout: page
title: Feedback service
parent: Services
---

# Feedback service

Feedback service allows users to submit feedback regarding their service interaction. It includes an backend API and a frontend widget.

## Client roles

client `urn:ads:platform:feedback-service`

| name              | description                                              |
| :---------------- | :------------------------------------------------------- |
| feedback-provider | Provider role that allows a user to send feedback.       |
| feedback-reader   | Allows a user to access feedback submitted by end-users. |

_Sites_ can be configured to allow anonymous feedback and in that case the send feedback request is not expected to include any credential. For _sites_ that don't allow anonymous feedback, the request must be in the context of a user with the `urn:ads:platform:feedback-service:feedback-provider` client role. In order to allow feedback from all authenticated users of an application, the associated client can include a hardcode role mapper to add the role to access tokens.

## Tenancy

- **Sending feedback.** Authenticated users send feedback to the tenant of their token, and need the `feedback-provider` role in that tenant. Anonymous requests name the tenant in the `tenant` field of the body (tenant name or tenant URN); without it the request is rejected with 400. Anonymous feedback is only accepted for sites configured with `allowAnonymous`, and is rate limited to 5 requests per 5 minutes per client.
- **Reading feedback.** Tenant users with the `feedback-reader` role read the feedback of their own tenant. Core users with the role set the `tenantId` query parameter to read a tenant's feedback; without it, `GET /feedback/v1/feedback` reads the feedback of all tenants. Core users must set `tenantId` for the feedback summary.
- **Sites.** Sites are tenant configuration. `GET /feedback/v1/sites` lists or counts sites across tenants, and is intended for core users.

## API overview

All endpoints are under `https://feedback-service.adsp.alberta.ca/feedback/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                                  | Purpose                                            | Required role                                             |
| :---------------------------------------- | :------------------------------------------------- | :-------------------------------------------------------- |
| `POST /feedback/v1/feedback`              | Send feedback for a site.                          | `feedback-provider`, or anonymous for sites that allow it |
| `GET /feedback/v1/feedback`               | Read submitted feedback, newest first.             | `feedback-reader`                                         |
| `GET /feedback/v1/feedback/summary`       | Summarize the feedback for a site and time period. | `feedback-reader`                                         |
| `GET /feedback/v1/sites`                  | List or count configured sites.                    | `feedback-reader` (core)                                  |
| `GET /feedback/v1/script/adspFeedback.js` | Download the feedback widget script.               | Anonymous                                                 |
| `GET /feedback/v1/script/integrity`       | Get the script digest for Subresource Integrity.   | Anonymous                                                 |

Sites are configured through the [configuration service](configuration-service.md); feedback service has no endpoints of its own for them.

## Concepts

### Site

A site represents a website against which feedback can be provided. A site can be configured to allow anonymous feedback, so that feedback is accepted from unauthenticated users. This may decrease the quality of feedback. Note that the feedback API does not (and is not reliably able to) check that feedback originates from the associated site. Sites are configured in the [configuration service](configuration-service.md) under the `platform:feedback-service` namespace and name.

### Feedback anonymization

The feedback service processes text content of submitted feedback using the [PII service](pii-service.md) to remove personally identifiable information.

## Events

Feedback service does not send or consume domain events. Received feedback is queued, processed, and then written as `feedback` values to the [value service](value-service.md) under the `feedback-service` namespace.

## Code examples

### Configure a site

Sites are configured using the [configuration service](configuration-service.md). Note that new configuration may take up to 15 mins to apply.

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';

const request = {
  operation: 'UPDATE',
  update: {
    sites: [
      {
        url: 'https://my-application.alberta.ca',
        allowAnonymous: false,
      },
    ],
  },
};

await fetch(`${configurationServiceUrl}/configuration/v2/configuration/platform/feedback-service`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

### Attach feedback widget

Feedback service provides a script for a frontend widget. The script sets a `adspFeedback` global variable when it is loaded, then the hosting site needs to initialize the widget with the name of the associated tenant, and css version for design system, default is 1.0 .

```html
<head>
  <!-- Site head -->
  <script src="https://feedback-service.adsp.alberta.ca/feedback/v1/script/adspFeedback.js"></script>
</head>
...
<body>
  <!-- Site body -->
  <script>
    adspFeedback.initialize({ tenant: 'My Tenant', designSystemsVersion: '2.0' });
  </script>
  <body></body>
</body>
```

The widget uses the location from which it is loaded to determine the feedback API URL, and uses the current site location for the context of the feedback. However, the hosting application can customize the widget behaviour via its interface.

```typescript
interface AdspFeedback {
  initialize(options: FeedbackOptions): void;
}

interface FeedbackOptions {
  tenant?: string;
  name?: string;
  site?: string;
  apiUrl?: string;
  getAccessToken?: () => Promise<string>;
  getContext?: () => Promise<FeedbackContext>;
}

export interface FeedbackContext {
  site: string;
  view: string;
  correlationId?: string;
}
```

### Send feedback

The `rating` field accepts one of the following values:

| Value      | Description    |
| :--------- | :------------- |
| terrible   | Very Difficult |
| bad        | Difficult      |
| neutral    | Neutral        |
| good       | Easy           |
| delightful | Very Easy      |

```typescript
const feedback = {
  tenant: 'My Tenant',
  context: {
    site: 'https://my-application.alberta.ca',
    view: '/site-view',
  },
  rating: 'good',
  comment: 'My experience was pretty good.',
  technicalIssue: 'I experienced some issues with slow loading.',
};

await fetch(`https://feedback-service.adsp.alberta.ca/feedback/v1/feedback`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(feedback),
});
```

### Retrieving feedback

Users with the `feedback-reader` role can read feedback, after anonymization, from the feedback API. Use `page.next` from the response as `after` to read the next page.

```typescript
const feedbackServiceUrl = 'https://feedback-service.adsp.alberta.ca';
const site = encodeURIComponent('https://my-application.alberta.ca');

const response = await fetch(
  `${feedbackServiceUrl}/feedback/v1/feedback?site=${site}&top=50&start=2024-10-10T12:00:00Z`,
  {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

const { feedback, page } = await response.json();
// feedback[0].value.rating, feedback[0].value.comment, page.next
```

### Summarize feedback for a site

```typescript
const response = await fetch(`${feedbackServiceUrl}/feedback/v1/feedback/summary?site=${site}`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { totalResponses, averageRating, responsesWithComments, responsesWithIssues } = await response.json();
```
