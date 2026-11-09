---
layout: page
title: Status service
nav_order: 13
parent: Services
---

# Status service
Status services provides configuration of applications, operational status of those applications, and allows posting of service notices.

## Client roles
client `urn:ads:platform:status-service`

| name | description |
|:-|:-|
| status-admin | Administrator role for status service. This role allows a user to read and update status service entities.  |

## Concepts
### Application
Applications represent digital services that an end user may wish to access. Each application should be meaningful and distinguishable to end users, so that they understand what tasks may be unavailable to the outage of any particular application.

### Status
The status of an application indicates whether the service is fully available to end users, may be experiencing disruption, or is in planned or unplanned outage.

### Health check
Health checks poll against an application endpoint to check for issues. It helps the tenant administrators monitor for issues. By default, health checks do not update the status. If `autoChangeStatus` is set on the application, the status changes from `operational` to `reported-issues` after the health check fails for 5 minutes, and back to `operational` after it succeeds for 5 minutes. Other statuses, such as `maintenance` and `outage`, are only changed manually.

### Notice
Notices are important messages to users regarding upcoming changes to an application. For example, they can be used to inform users of scheduled maintenance events or service disruptions.

## Audit
Changes made by status administrators are recorded in the [audit service](/adsp-monorepo/services/audit-service.html) under the `status-service` namespace. The actor is the administrator (ID, name and roles, without the email address), not the service account.

| Action | Resource | Notes |
|---|---|---|
| `application.created` / `application.updated` / `application.deleted` | application | |
| `application.status-changed` | application | Change set holds the previous and new status; each transition is its own record. |
| `notice.created` / `notice.updated` / `notice.deleted` | notice | Metadata holds the message, dates and mode. |
| `health-check.configured` | application | Health check URL changed, or monitoring enabled or disabled. |

Health check polling results, automatic status changes and public reads are not audited. Set `STATUS_AUDIT_ENABLED` to `false` to disable; when unset it follows the SDK `AUDIT_ENABLED` variable (on by default).
