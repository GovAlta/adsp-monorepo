---
title: Collecting Feedback
layout: page
nav_order: 1
parent: Feedback Service
grand_parent: Tutorials
---

## Collecting Feedback

The feedback service gives you a simple means to collect information from end-users about their experience when your site. When integrated into your application the service will:

- Add a call-to-action to the application that, when clicked, pops up a modal with a couple of questions for the end-user to fill in.
- Save the information collected in an ADSP database.

![](/adsp-monorepo/assets/feedback-service/feedbackWidget.png){: width="400" }

### Integration {#target-integration}

To integrate the service you only need to add a couple of lines of code to your application. First, you must include some javascript inside the head to load the widget:

```html
<head>
  ...
  <script src="https://feedback-service.adsp-uat.alberta.ca/feedback/v1/script/adspFeedback.js"></script>
</head>
```

The script creates a global variable called _adspFeedback_. Then, somewhere inside the body you would initialize the code:

```html
<body>
  ...
  <script>
    adspFeedback.initialize({ tenant: '<tenant name>' });
  </script>
</body>
```

That's it! The script will attach the _call-to-action_ to right hand side of the page which, when clicked, will pop up the feedback modal:

![](/adsp-monorepo/assets/feedback-service/call-to-action.png){: width="300" }

### Configuration & Context

Of course, feedback it not all that useful unless you can identify where it came from. To this end some _context_ is saved along the the feedback, including:

- the ADSP tenant,
- [the site](#target-site)
- [the view](#target-view),
- [a _correlationId_](#target-correlationid), and
- the time of submission.

For the most part the widget defines reasonable defaults for the context, but if required you can configure it as follows:

```javascript
const getContext = function () {
  return Promise.resolve({ site: <your site>, view: <your view>, correlationId:<an id> });
};

adspFeedback.initialize({tenant: <your tenant>, getContext: getContext})
```

Note: _getContext_ and its parameters are optional so unless you want to override the site, view or correlationId you can ignore it.

#### Tenant

Normally you would set the tenant in the _adspFeedback.initialize()_ function, as illustrated [above](#target-integration). In the special case where you have a multi-tenant application you can set the tenant as a query parameter in the application url, e.g. https://my-app.alberta.ca/start-page?tenant=<tenant name>.

#### Site {#target-site}

The site defaults to:

```javascript
`${document.location.protocol}//${document.location.host}`;
```

#### View {#target-view}

The view defaults to:

```javascript
document.location.pathname;
```

#### CorrelationId {#target-correlationid}

The correlationId is an optional string parameter that applications can use to correlate the feedback with another entity. For example, if your application requires users to log in you could _use a hash_ of their user id to determine if a user has submitted feedback more than once. Note: It is **important** that a user id is not used directly in the correlation ID, as it would be a violation of privacy.

The correlationId defaults to _site:view_

### Security

#### Unauthorized usage

As the widget is implemented in javascript and accessible through the browser it would be easy enough for anyone to try to use it for their own nefarious purposes, such as spam or DNS attacks. For this reason the service will only work with registered sites. To register your site, login to the ADSP website, select the feedback service, then the _Sites_ tab, and click the _Register site_ button.

![](/adsp-monorepo/assets/feedback-service/registerSite.png){: width="300" }

#### DNS attacks

The intent of the service is to put some protection in to mitigate the risk of DNS attacks. For now there is a simple strategy of removing the call-to-action once a user submits their feedback.

#### Privacy protection

End users should not enter any information in their feedback that could be used to identify them (PII), in accordance with Alberta's Personal Information Protection Act (PIPA), but not all Albertan's are familiar with it. To ensure that no such information is saved along with the rest of the feedback all comments are run through a redaction algorithm to remove it.

### Accessing your feedback

Feedback is stored in the ADSP [value service](https://govalta.github.io/adsp-monorepo/services/value-service.html) with namespace : _feedback-service_ and name : _feedback_. You can use the [value service APIs](https://api.adsp-dev.gov.ab.ca/autotest/?urls.primaryName=Value%20service) to retrieve and analyze the data, or you can login to the [ADSP webapp](https://adsp-uat.alberta.ca) to look at the service metrics. The data includes the feedback itself and the context so that you can make constrained queries. For example:

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
    ? context={site:'Farmers Market License Application'}
```
