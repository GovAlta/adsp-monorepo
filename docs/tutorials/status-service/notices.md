---
title: Notices
layout: page
nav_order: 4
parent: Status Service
grand_parent: Tutorials
---

## Notices

The _Status Service_ provides the ability for developers to post notices to communicate with their end users about upcoming maintenance windows or other events. A _notice_ can tell your users

- The current [status](/adsp-monorepo/tutorials/status-service/status.html) of the application e.g. _outage_,
- Reasons for the current status e.g. _server upgrade_,
- A time frame for the current status e.g. _1am till 3am_.

Notices can be created manually through the [Tenant Admin Webapp](https://adsp.alberta.ca) by navigating to the _Status Service_ page / _Notices_ tab, and clicking on the _Add Notice_ button

![](/adsp-monorepo/assets/status-service/add-notice.png)

Type the message you want end users to see in the description box, select the application that the notice applies to, and select the dates / times that are applicable. When you save the notice it is in draft form. You can _publish_ the notice at any time, thereby making it available on your tenant's public status page. It will look something like this:

![](/adsp-monorepo/assets/status-service/notice.png)

Your public static page for can be found at https://status.adsp.alberta.ca/{tenant name}, e.g.
https://status.adsp.alberta.ca/autotest. You can provide link to it from any page(s) available to your users when a service is down.

## Learn More

Learn how to

- get [notified](/adsp-monorepo/tutorials/status-service/notifications.html) about changes in application health and status.
- [monitor](/adsp-monorepo/tutorials/status-service/health.html) your application's health.
- use [status](/adsp-monorepo/tutorials/status-service/status.html) codes to keep users informed about application health.
