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
- **Sites.** Sites are tenant configuration. `GET /feedback/v1/sites` lists or counts sites. Core users with `feedback-reader` list or count across all tenants or one tenant; a tenant user with `feedback-reader` sees only their own tenant's sites.

## API overview

All endpoints are under `https://feedback-service.adsp.alberta.ca/feedback/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                                  | Purpose                                            | Required role                                             |
| :---------------------------------------- | :------------------------------------------------- | :-------------------------------------------------------- |
| `POST /feedback/v1/feedback`              | Send feedback for a site.                          | `feedback-provider`, or anonymous for sites that allow it |
| `GET /feedback/v1/feedback`               | Read submitted feedback, newest first.             | `feedback-reader`                                         |
| `GET /feedback/v1/feedback/summary`       | Summarize the feedback for a site and time period. | `feedback-reader`                                         |
| `GET /feedback/v1/sites`                  | List or count configured sites.                    | `feedback-reader` (own tenant; core for all tenants)      |
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

## Audit

The feedback service records audit events in the `feedback-service` namespace of the [audit service](audit-service.md). Records are written to the tenant of the feedback. All actions are version 1 and use the `feedback` resource type.

| Action                          | Category    | Severity | Retention class | Recorded when                                                                                                            |
| :------------------------------ | :---------- | :------- | :-------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `feedback.submitted`            | data-access | info     | standard        | Feedback is accepted and queued for processing.                                                                          |
| `feedback.anonymized`           | runtime     | info     | standard        | The comment or technical issue text of feedback is anonymized and the feedback is written to the value service.          |
| `feedback.anonymization-failed` | runtime     | warning  | security        | Anonymization of the text fails on the final attempt, so the feedback is dead lettered and not written (status `error`). |

Each submission is given an ID that is used as the resource ID, so the records of the same feedback can be matched. The `correlationId` of the feedback context, when set, is recorded as the correlation ID. The metadata includes the `site`, `view` and `rating`, and `commentProvided` and `technicalIssueProvided` flags. The comment and technical issue are free text that can contain personal information, so they are never recorded; nor are the anonymized text or the PII entities that were found. `feedback.anonymization-failed` also includes the `error` message.

- `feedback.submitted` uses the signed in user or service account (actor type `service`) as the actor. Anonymous feedback uses the actor `{ "id": "anonymous", "type": "user", "name": "Anonymous" }`.
- `feedback.anonymized` and `feedback.anonymization-failed` are recorded by the processing job with the actor `{ "id": "feedback-service-job", "type": "system", "name": "Feedback service job" }`. Feedback without text is not anonymized, so it has no `feedback.anonymized` record. A failed attempt that is retried is not recorded, and a failure to write the value is logged but not recorded as an anonymization failure.

Rejected feedback (for example an unknown site, or anonymous feedback to a site that does not allow it) and reading feedback, summaries and sites are not audited. Sites are configured in the configuration service, which records changes to the `platform:feedback-service` configuration, including `allowAnonymous` and `url` changes, as `configuration.updated` with a change set.

Audit failures are logged and do not fail the operation; pending events are delivered before the service shuts down. The service account of feedback service needs the `audit-writer` role of `urn:ads:platform:audit-service`. Set `FEEDBACK_AUDIT_ENABLED` to `false` to turn recording off; when unset it follows the SDK `AUDIT_ENABLED` variable (on by default), and `true` forces it on. The action catalog is registered on startup either way.

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
