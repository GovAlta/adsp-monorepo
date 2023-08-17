---
title: Introduction
layout: page
nav_order: 1
parent: Notification Service
grand_parent: Tutorials
---

## Introduction

The _Notification Service_ enables applications to easily implement functionality for notifying subscribers about significant events, or milestones, that occur when processing their applications or submissions. Users can subscribe to be notified when a _domain event_ associated with a _Notification Type_ is triggered. For example, you may want your users to be notified when an application has been accepted or rejected. To do this you would [configure the specifics](/adsp-monorepo/tutorials/notification-service/notification-types.html) of this requirement in the ADSP [Tenant admin webapp](https://adsp-uat.alberta.ca) and then add some logic and API calls to your application to subscribe users, and to trigger events when appropriate. The process looks something like this:

![](/adsp-monorepo/assets/notification-service/notification-service.png)

### Configuration

You can configure notifications for your particular needs by first defining one or more [domain events](/adsp-monorepo/tutorials/notification-service/events.html) for your application using the [Tenant admin Webapp](https://adsp-uat.alberta.ca/admin/services/event). A _domain event_ consists of a name, id, description, and a Json Schema describing the data that gets posted (event payload) along with it. For notifications, the data you want to post contains values for the _email template placeholders_ defined in the [notification type](/adsp-monorepo/tutorials/notification-service/notification-types.html).

Next, you will use the events to help configure your _Notification Types_. As with _domain events_ the latter can be defined in the [Tenant Admin Webapp](https://adsp-uat.alberta.ca/admin/services/notification). Notification types are the items to which end users are subscribed-to when you wish to notify them about one or more events of interest. The objects encapsulate information such as who can subscribe, the message to send, the channel by which it is sent, and the _domain events_ that will trigger a notification.

### Subscribing Users

End-users, as _subscribers_, are _subscribed_ to _Notification Types_, which represent the set of _domain events_ that can be triggered by your application. The relationships between the various entities looks like this:

![](/adsp-monorepo/assets/notification-service/notification-erd.png){: width="200" }

Subscribers and subscriptions are created by your application through the [Notification Service APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Notification%20service), or you can allow your users to manage their own subscriptions through the ADSP _Subscriber App_. Either way, your subscribers will be notified whenever your application triggers a _domain event_ that is associated with the _notification type_.

### Triggering Domain Events

The events you define when configuring your notifications are triggered in your application logic via ADSP's [Event Service APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Event%20service). When ADSP receives one, it will

- match the _domain event_ with a _notification type_,
- determine who needs to be notified, based on subscribers and notification criteria,
- combine the information in the event payload with the message template's placeholders
- send a notification through the appropriate channel

## Learn More

- Learn how to [configure a notification type](/adsp-monorepo/tutorials/notification-service/notification-types.html)
- Learn how to [manage subscribers](/adsp-monorepo/tutorials/notification-service/subscribers.html)
- Learn how to [configure and trigger domain events](/adsp-monorepo/tutorials/notification-service/events.html)
