---
title: Notifications
layout: page
nav_order: 5
parent: Status Service
grand_parent: Tutorials
---

## Notifications

Developers can subscribe to be notified of _health check_ or _status_ changes to their applications. Additionally, it is possible for end users to be notified of changes to an application's status.

### Health Check Change

Developers can subscribe to be notified whenever the health of a tenant's application changes, by logging in to the [Tenant Admin Webapp](https://adsp.alberta.ca)) and navigating to the _Status page_ / _Applications_ tab:

![](/adsp-monorepo/assets/status-service/health-change.png)

When the _I want to subscribe and receive notifications_ box is checked, you will be notified of changes to any application your tenant is monitoring, including those not publicly displayed on the tenant's _public status page_ (at https://status.adsp.alberta.ca/{tenant-name}).

### Status Update

End Users can subscribe to be notified whenever the status of a tenant's application changes. Each application can display a _public status page_ that lists the tenant's monitored applications and their current status. If a user enters their email address on the page, they will receive an email whenever a developer updates an application's status.

![](/adsp-monorepo/assets/status-service/subscribe.png)

The email contains a link so that the users can unsubscribe if they wish, which brings them to their personal ADSP _Subscription Management Page_. Users will see something like this on the page

![](/adsp-monorepo/assets/status-service/unsubscribe.png)

### Custom Email Templates

The above notifications are managed by the ADSP _Notification Service_, which provides email templates that you can customize to suit your application's needs. Simply log in to the [Tenant Management Webapp](https://adsp.alberata.ca) and navigate to the _Notification Service_ / _Notifications Type_ tab, where you will see a list of notifications. In particular, you will see the _Application Health Check Change_, and the _Application Status Update_ notification types.

![](/adsp-monorepo/assets/status-service/email-template.png)

Each _Notification Type_ consists of a set of _Events_, and a notification is triggered when one of the events is triggered. The _Application Health Check Change_ type, for example, responds to four events

- health-check-started
- health-check-stopped
- application-unhealthy
- application-healthy

You can customize the message sent for each of these events.

Email templates are built using HTML/CSS and a template language called [Handlebars](https://handlebarsjs.com/guide/), which is used for mapping a set of keys into the event properties. You would use a template key to represent the application name, for example, like this

{% raw %}

```handlebars
Health check has been started for {{event.payload.application.name}}
```

{% endraw %}

The following properties are available, depending on _Event Type_:

#### All

- event.payload.application.id
- event.payload.application.name
- event.payload.application.description
- event.payload.application.url
- event.payload.application.monitorOnly

In addition to the properties above, the individual, unique event types have:

#### Health Check Started

- event.payload.startedBy

#### Health Check Stopped

- event.payload.stoppedBy

#### Application Unhealthy

- event.payload.error

#### Application Healthy

- N/A

#### Application Status Changed

- event.payload.application.originalStatus
- event.payload.application.newStatus
- event.payload.application.updatedBy.userId
- event.payload.application.updatedBy.userName

#### Application Notice Published

- event.payload.notice.description
- event.payload.notice.startTimestamp
- event.payload.notice.endTimestamp
- event.payload.postedBy.userId
- event.payload.postedBy.userName

There are out-of-the-box default templates that you can start using right away. For a custom user experience though, consider building and managing your own.
