---
title: Notification Types
layout: page
nav_order: 2
parent: Notification Service
grand_parent: Tutorials
---

## Notification Types

_Notification types_ are objects that encapsulate the information ADSP needs to notify subscribers when one or more [domain events](/adsp-monorepo/tutorials/notification-service/events.html) are triggered by an application.

The functionality revolves around the concept of a _notification type_. These objects, constructed in the [Tenant admin webapp](https://adsp-uat.alberta.ca), allow you to specify all the information needed for ADSP to manage notifications for you, including:

- a name and description, for reference,
- the notification channels (email, sms, bot),
- the events that will trigger a notification,
- the roles needed for someone to subscribe to a notification type, and
- the message sent to users when a notification is triggered

Both of these objects are registered with ADSP when the _Notification Service_ is configured and integrated into the application.

There are two ways a notification type can be configured;

- Statically, through the easy-to-use [Tenant Admin Webapp's](https://adsp-uat.alberta.ca) Notification Service UI, or
- Dynamically, by integrating the [ADSP Notification Service API's](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Notification%20service) into your application.

## Basic Configuration

### Identification

### Channels

- Email
- SMS
- Bots

### Subscription Permissions

- Open to public
- Roles
- Users can manage

## Adding Events
