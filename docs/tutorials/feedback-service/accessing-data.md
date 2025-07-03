---
title: Accessing feedback data
layout: page
nav_order: 4
parent: Feedback Service
grand_parent: Tutorials
---

## Accessing your feedback

### Basic Access

The easiest way to access feedback for you site is through an API call

```
GET /feedback/v1/feedback
```

See the [swagger docs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Feedback%20service) for more detail.

### Fine Grained Access.

GET _/feedback/v1/feedback_ is a wrapper around a value-service API. It should satisfy most needs for extracting feedback entries from ADSP. However, feedback is stored in the ADSP [value service](https://govalta.github.io/adsp-monorepo/services/value-service.html) with namespace : _feedback-service_ and name : _feedback_. You can filter the data on a more fine-grained basis by using the value service directly, e.g. you could filter by _view_, or _correlationID_. You can use the [value service APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Value%20service) for this purpose. For example:

```
GET /value/v1/feedback-service/values/feedback
    ? correlationID='bob@bob.com'
```

will result in all the feedback submitted by a single user. You can also retrieve data by:

- view
- has comments
- has technical comments.

using context, e.g.

```
GET /value/v1/feedback-service/values/feedback
    ? context={view: '/admin/services/feedback', includesComments: true }
```
