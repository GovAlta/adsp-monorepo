---
layout: page
title: PII service
parent: Services
---

# PII service
PII service provides an API for analyzing for and anonymizing Personally Identifiable Information (PII) in unstructured text content. It is based on [Presidio](https://github.com/microsoft/presidio), applies the ADSP multi-tenant security layer using the [ADSP Flask SDK](../platform/platform-flask-sdk.md), and adds *recognizers* for some Canadian *entities*.

## Client roles
client `urn:ads:platform:pii-service`

| name | description |
|:-|:-|
| pii-analyzer | Analyzer role that allows a user or service account to make PII service API requests. |

## Concepts
### Entities
Entities represent categories of objects found in language. Presidio is based on Natural Language Processing capabilities in the Python ecosystem, and it applies Named Entity Recognition as a part of its processing pipeline.

### Recognizer
Recognizers are extensible components used by Presidio to identify PII entities. PII service adds recognizers for Canadian bank account number, passport, postal code, and social insurance number.

## Audit
Analyze and anonymize requests are recorded in the [audit service](/adsp-monorepo/services/audit-service.html) under the `pii-service` namespace. All actions use the `security` category and retention class.

| Action | Severity | Recorded when |
|---|---|---|
| `text.analyzed` | info | An analyze request completes. |
| `text.anonymized` | info | An anonymize request completes. |
| `text.analyze-failed` | warning | An analyze request fails with a client error (4xx), such as an unsupported language. |
| `text.anonymize-failed` | warning | An anonymize request fails with a client error (4xx). |
| `text.analyze-errored` | critical | An analyze request fails with a service error. |
| `text.anonymize-errored` | critical | An anonymize request fails with a service error. |

The actor is the caller of the API, typically a service account (identified by its `client_id`), not the person whose text is processed. The resource is a `text-processing-request` identified by the request `correlation_id`, or a generated one if none is supplied. Metadata holds the `language`, `scoreThreshold`, the number of entities detected (`entitiesDetected`), the calling service (`azp` claim) and, for failures, the `errorType`. Client errors are recorded with status `failure` and service errors with status `error`. The submitted text, detected values and replacements are never recorded.

The service account of PII service needs the audit service writer role. Set `AUDIT_ENABLED` to `false` to disable recording.

## Code examples
### Anonymize text
```typescript
  const request = {
    text: 'My text content to anonymize',
    language: 'en',
    score_threshold: 0.8,
  }

  await fetch(
    'https://pii-service.adsp.alberta.ca/pii/v1/anonymize',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
    }
  );
```
