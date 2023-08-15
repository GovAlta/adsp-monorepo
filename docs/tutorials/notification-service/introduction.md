---
title: Introduction
layout: page
nav_order: 1
parent: Notification Service
grand_parent: Tutorials
---

## Introduction

The _Notification Service_ enables applications to easily implement functionality for notifying subscribers about significant events, or milestones, that occur when processing their applications or submissions. Users can subscribe to be notified when one or more _domain events_ associated with a _Notification Type_ are triggered. For example, you may want your users to be notified when an application has been accepted or rejected. To do this you would [configure the specifics](/adsp-monorepo/tutorials/notification-service/notification-types.html) of this requirement in the ADSP [Tenant admin webapp](https://adsp-uat.alberta.ca) and then add some logic and API calls to your application to subscribe users, and to trigger events when appropriate.

Its even simpler if you let your users manage their own subscriptions via our [Subscriber app](/adsp-monorepo/tutorials/notification-service/subscribers.html)! The process looks something like this:

![](/adsp-monorepo/assets/notification-service/notification-service.png)

ADSP takes care of the rest. When your application triggers an event the system will use the information available in the _notification type_ to determine who needs to be notified, which channel (email, SMS) to use, and which message to send. Your users will be notified appropriately.

## Learn More

- Learn how to [configure a notification type](/adsp-monorepo/tutorials/notification-service/notification-types.html)
- Learn how to [manage subscribers](/adsp-monorepo/tutorials/notification-service/subscribers.html)
- Learn how to [configure and trigger domain events](/adsp-monorepo/tutorials/notification-service/events.html)
