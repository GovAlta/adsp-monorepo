---
title: Application Health
layout: page
nav_order: 2
parent: Status Service
grand_parent: Tutorials
---

## Application Health

Application health is determined by pinging a URL, supplied by a developer, every minute or so. Health is determined by examining the response returned by the URL and can be either

- Healthy, if the status code is not in the 400s or 500s
- Untimely, if the response takes over 1000ms
- Unhealthy if the response times out or returns a status code in the 400s or 500s

You can see how your application has responded over the last half hour by visiting the _Status Service page_ / _Applications tab_ on the [Tenant Admin Webapp](https://adsp.alberta.ca).

### Status Service Webpage

You can use the [Tenant Admin Webapp](https://adsp.alberta.ca) to

- configure which applications you want monitored
- control monitoring
- view health checks

in addition to working with the application status. The latter is covered [here](/adsp-monorepo/tutorials/status-service/status.html).

### Monitoring an Application

To monitor an application's health you simply got to the Tenant Admin Webapp's _Status Service_ page and click the _Add Application_ button.

![](/adsp-monorepo/assets/status-service/app-entry.png)

Enter the application name and description - something to identify the application to you and your users, and the URL that will be used to ping it. The URL should be for a public page, such as application's home, otherwise the ping might return a 401 or 403 and be classified as unhealthy. Once the information is submitted you'll see some controls and a status bar.

![](/adsp-monorepo/assets/status-service/monitoring.png)

Click _start health check_ to begin pinging. The status bar will update every minute, and you will be able see the results pile in for the next 1/2 hour. The status bar is really just for testing purposes; the status service comes into its own when you start using [notifications](/adsp-monorepo/tutorials/status-service/notifications.html) to keep abreast of health changes.

### APIs

You can also monitor and control an application's health, via the [Status Service APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Status%20service), from another application. This would only be necessary if you wished to provide your own interface to keep user's notified, or perhaps to perform some sort of automated diagnostic on the application in question.

## Learn More

Learn how to

- use [status](/adsp-monorepo/tutorials/status-service/status.html) codes to keep users informed about application health.
- provide [notices](/adsp-monorepo/tutorials/status-service/notices.html) about application status to end users.
- get [notified](/adsp-monorepo/tutorials/status-service/notifications.html) about changes in application health and status.
