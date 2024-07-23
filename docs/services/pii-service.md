---
layout: page
title: PII service
nav_order: 19
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
