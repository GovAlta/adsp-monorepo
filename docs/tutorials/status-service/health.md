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

## Status Service Webpage

You can use the [Tenant Admin Webapp](https://adsp.alberta.ca) to

- configure which applications you want monitored
- control monitoring
- view health checks

in addition to working with the application status. The latter is covered [here](/adsp-monorepo/tutorials/status-service/status.html).

### Monitoring Applications

To monitor an application's health you simply got to the Tenant Admin Webapp's _Status Service_ page and click the _Add Application_ button.

![](/adsp-monorepo/assets/status-service/app-entry.png)

Enter the application name and description - something to identify the application to you and your users, and the URL that will be used to ping it. The URL should be for a public page, such as application's home, otherwise the ping might return a 401 or 403 and be classified as unhealthy. Once the information is submitted

!{}(/adsp-monorepo/assets/status-service/monitoring.png)
