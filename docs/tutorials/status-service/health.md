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

You can see how your application has responded over the last half hour by visiting the Status Service page on the [Tenant Admin Webapp](https://adsp.alberta.ca).

## Status Service Webapp
