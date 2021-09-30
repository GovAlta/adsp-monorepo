---
layout: page
title: Status service
nav_order: 6
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
Health checks poll against an application endpoint to check for issues. It helps the tenant administrators monitor for issues but does not automatically update status.

### Notice
Notices are important messages to users regarding upcoming changes to an application. For example, they can be used to inform users of scheduled maintenance events or service disruptions.
