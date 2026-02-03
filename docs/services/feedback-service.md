---
layout: page
title: Feedback service
nav_order: 18
parent: Services
---

# Feedback service
Feedback service allows users to submit feedback regarding their service interaction. It includes an backend API and a frontend widget.

## Client roles
client `urn:ads:platform:feedback-service`

| name | description |
|:-|:-|
| feedback-provider | Provider role that allows a user to send feedback. |

*Sites* can be configured to allow anonymous feedback and in that case the send feedback request is not expected to include any credential. For *sites* that don't allow anonymous feedback, the request must be in the context of a user with the `urn:ads:platform:feedback-service:feedback-provider` client role. In order to allow feedback from all authenticated users of an application, the associated client can include a hardcode role mapper to add the role to access tokens.

## Concepts
### Site
A site represents a website against which feedback can be provided. A site can be configured to allow anonymous feedback, so that feedback is accepted from unauthenticated users. This may decrease the quality of feedback. Note that the feedback API does not (and is not reliably able to) check that feedback originates from the associated site. Sites are configured in the [configuration service](configuration-service.md) under the `platform:feedback-service` namespace and name.

### Feedback anonymization
The feedback service processes text content of submitted feedback using the [PII service](pii-service.md) to remove personally identifiable information.

## Code examples
### Configure a site
Sites are configured using the [configuration service](configuration-service.md). Note that new configuration may take up to 15 mins to apply.

```typescript
  const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';

  const request = {
    operation: 'UPDATE',
    update: {
      sites: [{
        url: 'https://my-application.alberta.ca',
        allowAnonymous: false,
      }]
    }
  }

  await fetch(
    `${configurationServiceUrl}/configuration/v2/configuration/platform/feedback-service`,
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

### Attach feedback widget
Feedback service provides a script for a frontend widget. The script sets a `adspFeedback` global variable when it is loaded, then the hosting site needs to initialize the widget with the name of the associated tenant.

```html
<head>
  <!-- Site head -->
  <script src="https://feedback-service.adsp.alberta.ca/feedback/v1/script/adspFeedback.js"></script>
</head>
...
<body>
  <!-- Site body -->
  <script>adspFeedback.initialize({tenant: 'My Tenant'})</script>
<body>
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

| Value | Description |
|:-|:-|
| terrible | Very Difficult |
| bad | Difficult |
| neutral | Neutral |
| good | Easy |
| delightful | Very Easy |

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
  }

  await fetch(
    `https://feedback-service.adsp.alberta.ca/feedback/v1/feedback`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    }
  );
```

### Retrieving feedback
After anonymization, feedback is written to the [value service](value-service.md) and can be retrieved via its API.

```typescript
  const valueServiceUrl = 'https://value-service.adsp.alberta.ca';
  const top = 50;
  const timestampMin = `2024-10-10T12:00:00Z`;

  const response = await fetch(
    `${valueServiceUrl}/value/v1/feedback-service/values/feedback?top=${top}&timestampMin=${timestampMin}`,
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