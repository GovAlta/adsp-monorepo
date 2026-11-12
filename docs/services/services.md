---
layout: page
title: Services
nav_order: 4
has_children: true
---

# Services

ADSP platform services are multi-tenant APIs that product teams use instead of building the same capabilities themselves. Each service guide covers the service's client roles, tenancy, API overview, concepts, events and code examples. Request and response schemas for every API are in the [API documentation](https://api.adsp.alberta.ca).

Requests to a service are scoped to the tenant of the caller's access token. Platform (core) service accounts can act on behalf of a tenant by passing a `tenantId`. See [Tenant service](tenant-service.md) for how tenants map to realms, and [Directory service](directory-service.md) for how to look up service URLs by URN.

## Foundation

| Service                                           | Use it to                                                          |
| :------------------------------------------------ | :----------------------------------------------------------------- |
| [Access service](access-service.md)               | Sign users in and manage roles, using a Keycloak realm per tenant. |
| [Tenant service](tenant-service.md)               | Create and look up tenants.                                        |
| [Directory service](directory-service.md)         | Find service and API URLs from logical URNs.                       |
| [Configuration service](configuration-service.md) | Store tenant and platform configuration, with revisions.           |
| [Event service](event-service.md)                 | Send domain events, which are logged and routed to other services. |
| [Value service](value-service.md)                 | Store time series values and metrics, including the event log.     |
| [Push service](push-service.md)                   | Stream domain events to applications over WebSockets or webhooks.  |

## Application capabilities

| Service                                               | Use it to                                                                       |
| :---------------------------------------------------- | :------------------------------------------------------------------------------ |
| [Form service](form-service.md)                       | Define forms, and let applicants draft and submit them.                         |
| [File service](file-service.md)                       | Upload, scan and download files, with access controlled by file type.           |
| [Notification service](notification-service.md)       | Send email, SMS and bot notifications to subscribers when domain events happen. |
| [Task service](task-service.md)                       | Queue work and assign it to workers.                                            |
| [Comment service](comment-service.md)                 | Add topics and comments to application records.                                 |
| [Calendar service](calendar-service.md)               | Look up dates and holidays, and schedule calendar events.                       |
| [PDF service](pdf-service.md)                         | Generate PDFs from templates.                                                   |
| [Export service](export-service.md)                   | Export another service's API resources to a file.                               |
| [Verify service](verify-service.md)                   | Generate and check time-limited verification codes.                             |
| [Feedback service](feedback-service.md)               | Collect user feedback with an embeddable widget.                                |
| [Status service](status-service.md)                   | Monitor application health, publish status and post service notices.            |
| [Audit service](audit-service.md)                     | Record and search audit records of who did what to which resource.              |
| [PII service](pii-service.md)                         | Find and anonymize personally identifiable information in text.                 |
| [Cache service](cache-service.md)                     | Cache reads from upstream APIs within the tenant security model.                |
| [Token handler](token-handler.md)                     | Sign users in to a browser application with a session cookie instead of tokens. |
| [Agent service](agent-service.md)                     | Run configurable AI agents with tools and role-based access.                    |
| [Project planner service](project-planner-service.md) | Turn a business problem into a plan for using ADSP services.                    |

## Operations

- [Access service backup and disaster recovery](access-service-backup-disaster-recovery.md)
