---
title: Introduction
layout: page
nav_order: 1
parent: Feedback Service
grand_parent: Tutorials
---

## Introduction

The feedback service gives you a simple means to collect information from end-users about their experience when your site. When integrated into your application the service will:

- Add a call-to-action to the application that, when clicked, pops up a modal with a couple of questions for the end-user to fill in.
- Save the information collected in an ADSP database.

![](/adsp-monorepo/assets/feedback-service/feedbackWidget.png){: width="400" }

### Integration

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

### Configuring the widget

### Security
