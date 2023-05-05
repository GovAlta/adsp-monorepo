---
title: Introduction
layout: page
nav_order: 1
parent: Status Service
grand_parent: Tutorials
---

# <span style="color:red">-- Under Construction --</span>

## Introduction

The _Status Service_ helps you monitor the health of your applications and services, and includes

- notification when an application's _health_ changes,
- a public, static status page that can be used to inform end users about Application Status,
- notification when an application's _status_ changes,
- customized notification messages

End users interested in the applications status are also able to get notified when the application's status changes.

## Health and Status

- Application _health_ is determined by pinging a developer-supplied URL every minute or so, and is either _healthy_ or _unhealthy_. Developers can be notified, by text or email, when an applications health changes

- Application _status_ is set by developers to inform end-users about planned (or otherwise) service outages. The status can be set to _operational_, _maintenance_, _outage_, or _reported issues_.

## Notices and Notifications

Notices are used to inform end-users about an Application's Status. They may include

- reasons for the outage
- a time-frame for planned outages

Notices are displayed on a public, static webpage that applications can link to, so users can quickly determine their status.

Notifications are triggered when an application's health or status changes. Developers can subscribe to be notified about health changes, while end-users can subscribe to be notified when the status changes. The latter is a self-serve operation available through the public status page mentioned above, and is delivered by email. Developers can be notified by either text or email.

## Learn More

Learn how to

- [monitor](/adsp-monorepo/tutorials/status-service/health.html) your application's health.
- use [status](/adsp-monorepo/tutorials/status-service/status.html) codes to keep users informed about application health.
- provide [notices](/adsp-monorepo/tutorials/status-service/notices.html) about application status to end users.
- get [notified](/adsp-monorepo/tutorials/status-service/notifications.html) about changes in application health and status.
