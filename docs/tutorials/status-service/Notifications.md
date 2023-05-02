---
title: Notifications
layout: page
nav_order: 5
parent: Status Service
grand_parent: Tutorials
---

## Notifications

Developers can subscribe to be notified of _health check_ or _status_ changes to their applications. Additionally, it is possible for end users to be notified of changes to an application's status.

### Health Check

Developers can subscribe to be notified whenever the health of a tenant's application changes, by logging in to the [Tenant Admin Webapp](https://adsp.alberta.ca)) and navigating to the Status page / Applications tab:

![](/adsp-monorepo/assets/status-service/health-change.png)

When checked, you will be notified of changes to any application your tenant is monitoring, including those not publicly displayed on the tenant's _public status page_ (at https://status.adsp.alberta.ca/{tenant-name}).

### Status Change

End Users can subscribe to be notified whenever the status of a tenant's application changes. Each application can display a _public status page_ that lists the tenant's monitored applications and their current status. If a user enters their email address on the page, they will receive an email whenever a developer updates an application's status.

![](/adsp-monorepo/assets/status-service/subscribe.png)

The email contains a link so that the users can unsubscribe if they wish, which brings them to their personal ADSP _Subscription Management Page_. Users will see something like this on the page

![](/adsp-monorepo/assets/status-service/unsubscribe.png)

### Email Templates

The above notifications are managed by the ADSP Notification Service, which provides email templates that you can customize to suit your application's needs. Simply log in to the ADSP [Tenant Management Webapp](https://adsp.alberata.ca) and navigate to the _Notification Service_ / _Notifications Type_ tab.

![](/adsp-monorepo/assets/status-service/email-template.png)
