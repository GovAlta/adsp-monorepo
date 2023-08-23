---
title: Events
layout: page
nav_order: 4
parent: Notification Service
grand_parent: Tutorials
---

## Events

You can configure notifications for your particular needs by first defining one or more [domain events](/adsp-monorepo/tutorials/notification-service/events.html) for your application using the [Tenant admin Webapp](https://adsp-uat.alberta.ca/admin/services/event). A _domain event_ consists of a name, id, description, and a Json Schema describing the data that gets posted (event payload) along with it. For notifications, the data you want to post contains values for the _email template placeholders_ defined in the [notification type](/adsp-monorepo/tutorials/notification-service/notification-types.html).

## Triggering Events

The events you define when configuring your notifications are triggered in your application logic via ADSP's [Event Service APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Event%20service). When ADSP receives one, it will

- match the _domain event_ with a _notification type_,
- determine who needs to be notified, based on subscribers and notification criteria,
- combine the information in the event payload with the message template's placeholders, and
- send a notification through the appropriate channel.
