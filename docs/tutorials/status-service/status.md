---
title: Application Status
layout: page
nav_order: 3
parent: Status Service
grand_parent: Tutorials
---

## Monitoring Applications

The status service provides a means for monitoring application health, by pinging a URL provided by the developer every minute. Health is determined by examining the response returned by the URL and can be

- Healthy, if the status code is not in the 400s or 500s
- Untimely, if the response takes over 1sec
- Unhealthy if the response times out or returns a status code in the 400s or 500s

You can see how your application has responded over the last half hour by visiting the

## Notifications

You can subscribe

### Subscription App

Manage subscriptions in notification service?

### Health check events

You can register with the notification service to receive notifications for application health check changes, such as:

- when a health check is started or stopped,
- when a health check detects that an application changes from healthy to unhealthy.

Teams can use this notification type to monitor and address application issues.

### Status updates

Provides notifications of application status updates and new published notices. Public users can subscribe to this notification type from the status application.
