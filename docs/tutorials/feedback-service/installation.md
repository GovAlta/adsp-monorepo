---
title: Installation
layout: page
nav_order: 2
parent: Feedback Service
grand_parent: Tutorials
---

## Installation

The feedback service gives you a simple means to collect information from end-users about their experience when your site. When integrated into your application the service will:

- Add a call-to-action to the application that, when clicked, pops up a modal with a couple of questions for the end-user to fill in.
- Save the information collected in an ADSP database.

<p align='center' with='100%'>
  <img src='/adsp-monorepo/assets/feedback-service/feedbackWidget.png' width='400px'/>
</p>

## Application Integration {#target-integration}

To install the service you only need to add a couple of lines of code to your application. First, you must include some javascript inside the head to load the widget:

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
