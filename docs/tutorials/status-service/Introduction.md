---
title: Introduction
layout: page
nav_order: 1
parent: Status Service
grand_parent: Tutorials
---

## Introduction

The _Status Service_ lets you

- monitor the _health_ of your applications, and
- keep your users informed of an application's _status_.

For our purposes:

- Application _health_ is defined by pinging a developer-supplied URL every minute or so, and based on the response is either _healthy_ or _unhealthy_.
- Application _status_ is set by developers to inform end-users about planned (or otherwise) service outages.

In addition, the Status Service

- sends notifications to developers when an application's _health_ changes,
- sends notifications to developers and end-users when an application's _status_ changes,
- lets you customize notification messages (email or text),
- provides a public, static status page for your tenant that can be used to inform end users about an Application's Status.

## Notices and Notifications

Notices are used to inform end-users about an Application's Status. They may include

- reasons for the outage
- a time-frame for planned outages

Notices are displayed on a public, static webpage that applications can link to, so users can quickly determine their status.

Notifications are triggered when an application's health or status changes. Developers can subscribe to be notified about health changes, while end-users can subscribe to be notified when the status changes. The latter is a self-serve operation available through the public status page mentioned above, and is delivered by email. Developers can be notified by either text or email.

## Learn More

Learn how to

- [monitor](/adsp-monorepo/tutorials/status-service/health.html) your application's health.
- use [status codes](/adsp-monorepo/tutorials/status-service/status.html) to keep users informed about application health.
- provide [notices](/adsp-monorepo/tutorials/status-service/notices.html) about application status to end users.
- get [notified](/adsp-monorepo/tutorials/status-service/notifications.html) about changes in application health and status.
