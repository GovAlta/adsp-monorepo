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

<p align='center' with='100%'>
  <img src='/adsp-monorepo/assets/feedback-service/feedbackWidget.png' width='400px'/>
</p>

## Application Integration {#target-integration}

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
    adspFeedback.initialize();
  </script>
</body>
```

There are configuration parameters you will want to add to the initialization method, but essentially that's it. The script will attach the _call-to-action_ to right hand side of the page which, when clicked, will pop up the feedback modal:

<p align='center' with='100%'>
  <img src='/adsp-monorepo/assets/feedback-service/call-to-action.png' width='300px'/>
</p>

## Configuration

There are a few ways you can configure the feedback service to tailor it to your needs, including

- tenant identification
- source identification
- allowing anonymous users
- associating feedback with another entity, such as an end-user

### Tenant Identification

As part of ADSP, feedback records are associated with a _tenant_, and there is no crossover. That is, when you access feedback records you will only be able to get those associated with your tenant. To that end it is important when you are initializing your widget that you identify it. The means of identification might be different depending on whether or not your application is allowing anonymous access to the widget.

For many applications feedback will be coming from logged in users. In order for the widget to work properly it will need the user's valid keycloak access token. Since valid tokens only last for a few minutes you'll need to pass in a function that can be used by the widget to obtain the token, so your initialization might look like this:

```html
<body>
  ...
  <script>
    adspFeedback.initialize({getAccessToken: () => {<your getter method>}});
  </script>
</body>
```

The tenant name will be extracted from the access token, and the feedback information will then be associated with it.

Note: The service itself does not make a record of the user ID in the access token. If this is desired you can use the [correlation ID](#target-correlationid) for this purpose.

#### Anonymous access

For anonymous access you must submit your tenant name directly, as follows:

```html
<body>
  ...
  <script>
    adspFeedback.initialize({tenant: <your tenant name>});
  </script>
</body>
```

In the special case where you have a multi-tenant application you can set the tenant as a query parameter in the application url, e.g. https://my-app.alberta.ca/start-page?tenant=\<your tenant\>.

In addition though, for security purposes, you must explicitly configure your site to allow anonymous access. This can be done when you [register your site](#target-registered-usage).

<p align='center' with='100%'>
  <img src='/adsp-monorepo/assets/feedback-service/allowAnonymousFeedback.png' width='300px'/>
</p>

### Source Identification

Of course, feedback it not all that useful unless you can identify where it came from. To this end some _context_ is saved along the the feedback, including:

- [the site](#target-site)
- [the view](#target-view),
- [a _correlationId_](#target-correlationid), and
- the time of submission.

For the most part the widget defines reasonable defaults for the context, but if required you can configure it as follows:

```javascript
const getContext = function () {
  return Promise.resolve({ site: <your site>, view: <your view>, correlationId:<any id> });
};

adspFeedback.initialize({getAccessToken: <your function>, getContext: getContext})
```

Note: _getContext_ and its parameters are optional so unless you want to override the _site_, _view_ or _correlationId_ you can ignore it.

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

#### Correlation ID {#target-correlationid}

The correlation ID is an optional string parameter that applications can use to correlate the feedback with another entity. For example, if your application requires users to log in you could _use a hash_ of their user id to determine if a user has submitted feedback more than once. Note: It is **important** that a user id is not used directly in the correlation ID, as it would be a violation of privacy.

The correlationId defaults to:

```javascript
`${site}:${view}`;
```

### Security

There are several ways ADSP has addressed security concerns regarding use of the feedback widget. These include:

- A mandatory site registration for sites using the service,
- Sub-resource integrity,
- DNS attacks,
- Privacy protection

#### Registered usage {#target-registered-usage}

As the widget is implemented in javascript and accessible through the browser it would be easy enough for anyone to try to use it for their own nefarious purposes, such as spam or DNS attacks. For this reason the service will only work with registered sites. To register your site, login to the ADSP website, select the feedback service, then the _Sites_ tab, and click the _Register site_ button.

<p align='center' with='100%'>
  <img src='/adsp-monorepo/assets/feedback-service/registerSite.png' width='300px'/>
</p>

#### Sub-resource Integrity (SRI)

Sub-resource integrity is a technique you can use to verify that the javascript resource fetched by you application has not been manipulated. The technique is described in detail [here](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity). You can obtain an encoded integrity string by calling an endpoint for this purpose, i.e.

```
GET /feedback/v1/script/integrity
```

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
    ? context={site:'https://adsp-dev.gov.ab.ca', view: '/admin/services/feedback'}
```
