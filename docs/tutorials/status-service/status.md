---
title: Application Status
layout: page
nav_order: 3
parent: Status Service
grand_parent: Tutorials
---

## Application Status

Application status is the _operational status_ of your application that can be set manually through the Status Service page on the [Tenant Admin Webapp](https://adsp.alberta.ca) or automatically, by integrating the [status service APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Status%20service) with your application. Operational status can take on one of four values:

- Operational: The application is up and running,
- Maintenance: The application is undergoing routine maintenance,
- Outage: The application is down,
- Reported Issues: An issue has been reported and is being looked into.

To set the status manually, simply go to the [Tenant Admin Webapp](https://adsp.alberta.ca) and go to the _Applications_ tab. Look for your application of interest, and click on the _change status_ button.

![](/adsp-monorepo/assets/status-service/monitoring.png)

You can select one of the four statuses mentioned above.

Changing an application's status can affect users in a couple of ways. It will

- update the status on the public static webpage provided for your tenant, and
- notify anyone who has subscribed for notification of change. This includes end users.

The public status page for your tenant can be found at at https://status.adsp.alberta.ca/{tenant-name}. Linking to this will give your users information about your tenant applications, including any [notices](/adsp-monorepo/tutorials/status-service/notifications.html) you may have posted. The latter gives you the ability to post information about a status change, including expected times. This is useful, for example, to inform users of upcoming maintenance windows or current outages.

## Learn More

- Learn how to [monitor](/adsp-monorepo/tutorials/status-service/health.html) your application's health.
- Learn how to provide [Notices](/adsp-monorepo/tutorials/status-service/notices.html) about application status to end users.
- Learn how to [get notified](/adsp-monorepo/tutorials/status-service/notifications.html) about changes in application health and status.
