---
title: Accessing feedback data
layout: page
nav_order: 4
parent: Feedback Service
grand_parent: Tutorials
---

## Accessing your feedback

Your feedback is stored in the ADSP [value service](https://govalta.github.io/adsp-monorepo/services/value-service.html) with namespace : _feedback-service_ and name : _feedback_. You can use the [value service APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Value%20service) to retrieve and analyze the data, or you can login to the [ADSP webapp](https://adsp-uat.alberta.ca) to look at the service metrics. The data includes the feedback itself and the context so that you can make constrained queries. For example:

```
GET /value/v1/feedback-service/values/feedback
    ? timestampMIN=2024-05-01T00:00:00Z
    & timestampMAX=2024-06-03T59:59:59Z
```

will result in all the feedback submitted for your tenant between March 5, 2024 and June 3, 2024. You can also retrieve data by:

- correlationId,
- site,
- view

using context, e.g.

```
GET /value/v1/feedback-service/values/feedback
    ? context={site:'https://adsp-uat.alberta.ca', view: '/admin/services/feedback'}
```
