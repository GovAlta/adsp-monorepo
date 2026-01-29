---
title: Introduction
layout: page
nav_order: 1
parent: Notification Service
grand_parent: Tutorials
---

## Introduction

The _Notification Service_ enables applications to quickly implement features for notifying users about significant events, or milestones, that occur when processing their applications or other submissions. It includes:

- capabilities for defining _domain events_, which an application uses to trigger the notifications,
- capabilities for designing message templates, which are used to send customized notifications to subscribers,
- API's for subscribing users to receive notifications,
- API's for triggering notifications via the _domain events_, and
- application defined criteria for determining exactly which subscribers get notified.

For example, you may want a user to be notified when their application for money has been accepted or rejected. To do this you might

- define two domain events; application-approved, and application-rejected,
- define a text message template: "Your application has been {{ application-status }}", where _application-status_ is a placeholder that is filled in when the notification is sent,
- add some logic and API calls to your application to subscribe a user to the notifications when their application is submitted,
- add some logic and API calls to trigger _application-accepted_ when the application has been approved.

The process looks something like this:

![](/adsp-monorepo/assets/notification-service/notification-service.png)

Defining events and message templates is an easy, one step, process done through the [Tenant Admin Webapp](https://adsp-uat.alberta.ca/admin/services/notification). Adding API calls for subscribing users and sending events to your code requires a bit more work, but there are only a few of them, each with minimal complexity.

## Learn More

- Learn how to [configure notifications](/adsp-monorepo/tutorials/notification-service/notification-types.html)
- Learn how to [manage subscribers](/adsp-monorepo/tutorials/notification-service/subscribers.html)
- Learn how to [configure and trigger domain events](/adsp-monorepo/tutorials/notification-service/events.html)
- Learn how to [add an email attachment to your notification](/adsp-monorepo/tutorials/notification-service/emailAttachment.html)
