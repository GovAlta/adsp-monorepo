---
title: Security
layout: page
nav_order: 3
parent: Feedback Service
grand_parent: Tutorials
---

## Security

There are several ways ADSP has addressed security concerns regarding use of the feedback widget. These include:

- A mandatory site registration for sites using the service,
- Sub-resource integrity,
- DNS attacks,
- Privacy protection

### Registered usage {#target-registered-usage}

As the widget is implemented in javascript and accessible through the browser it would be easy enough for anyone to try to use it for their own nefarious purposes, such as spam or DNS attacks. For this reason the service will only work with registered sites. To register your site, login to the ADSP website, select the feedback service, then the _Sites_ tab, and click the _Register site_ button.

<p align='center' with='100%'>
  <img src='/adsp-monorepo/assets/feedback-service/registerSite.png' width='300px'/>
</p>

### Sub-resource Integrity (SRI)

Sub-resource integrity is a technique you can use to verify that the javascript resource fetched by you application has not been manipulated. The technique is described in detail [here](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity). You can obtain an encoded integrity string by calling an endpoint for this purpose, i.e.

```
GET /feedback/v1/script/integrity
```

### DNS attacks

The intent of the service is to put some protection in to mitigate the risk of DNS attacks. For now there is a simple strategy of removing the call-to-action once a user submits their feedback.

### Privacy protection

End users should not enter any information in their feedback that could be used to identify them (PII), in accordance with Alberta's Personal Information Protection Act (PIPA), but not all Albertan's are familiar with it. To ensure that no such information is saved along with the rest of the feedback all comments are run through a redaction algorithm to remove it.
