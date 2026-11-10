---
layout: page
title: Status service
parent: Services
---

# Status service

Status services provides configuration of applications, operational status of those applications, and allows posting of service notices.

## Client roles

client `urn:ads:platform:status-service`

| name         | description                                                                                                                                                                                    |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| status-admin | Administrator role for status service. It is included in the tenant admin role. The notice endpoints require it to create, update, and delete notices, and to read draft and archived notices. |

The application endpoints (`/status/v1`) require an authenticated user of the tenant, but don't check for a specific role. The public status endpoint is anonymous.

## Tenancy

- **Application and notice management.** Tenant users act on the tenant of their token. These endpoints don't accept a `tenantId` parameter, so a token without a tenant context (a core user) is not supported.
- **Isolation.** Applications and notices of other tenants respond 404.
- **Public status.** `GET /public_status/v1/applications/{tenant}` takes the tenant name in the path and doesn't need a token.
- **Public notices.** Anonymous requests to `GET /notice/v1/notices` read published notices; set the `name` query parameter to a tenant name to read only that tenant's notices. Authenticated users read the notices of the tenant of their token.
- **Configuration.** Applications are stored in the tenant's `platform:status-service` configuration in the [configuration service](configuration-service.md). The status service uses only the tenant configuration; there are no platform (core) applications.

## API overview

All endpoints are under `https://status-service.adsp.alberta.ca`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                                                             | Purpose                                               | Required role                                         |
| :------------------------------------------------------------------- | :---------------------------------------------------- | :---------------------------------------------------- |
| `GET /status/v1/applications`                                        | List the tenant's applications with their status.     | Authenticated tenant user                             |
| `POST /status/v1/applications`                                       | Add an application.                                   | Authenticated tenant user                             |
| `PUT /status/v1/applications/{appKey}`                               | Replace an application's configuration.               | Authenticated tenant user                             |
| `DELETE /status/v1/applications/{appKey}`                            | Delete an application and its health check results.   | Authenticated tenant user                             |
| `PATCH /status/v1/applications/{appKey}/enable`, `disable`, `toggle` | Turn health checks on or off.                         | Authenticated tenant user                             |
| `PATCH /status/v1/applications/{appKey}/status`                      | Set the published status of an application.           | Authenticated tenant user                             |
| `GET /status/v1/applications/{appKey}/endpoint-status-entries`       | Read the health check results of an application.      | Authenticated tenant user                             |
| `GET /status/v1/applications/endpoint-status-entries`                | Read recent health check results.                     | Authenticated tenant user                             |
| `GET /status/v1/webhook/{id}/test/{eventName}`                       | Send a test event to a monitoring webhook.            | Authenticated tenant user                             |
| `GET /public_status/v1/applications/{tenant}`                        | Read the published status of a tenant's applications. | Anonymous                                             |
| `GET /notice/v1/notices`                                             | List notices.                                         | Anonymous (published), `status-admin` (all)           |
| `GET /notice/v1/notices/{id}`                                        | Read a notice.                                        | Authenticated tenant user (published), `status-admin` |
| `POST /notice/v1/notices`                                            | Create a draft notice.                                | `status-admin`                                        |
| `PATCH /notice/v1/notices/{id}`                                      | Update, publish, or archive a notice.                 | `status-admin`                                        |
| `DELETE /notice/v1/notices/{id}`                                     | Delete a draft notice.                                | `status-admin`                                        |

The service contact information and the intervals of [webhooks](/adsp-monorepo/tutorials/status-service/webhooks.html) are managed in the tenant's `platform:status-service` configuration through the configuration service; the status service has no endpoints of its own for them. Monitoring webhooks themselves are configured in the push service.

## Concepts

### Application

Applications represent digital services that an end user may wish to access. Each application should be meaningful and distinguishable to end users, so that they understand what tasks may be unavailable to the outage of any particular application. Applications with `monitorOnly` set are monitored but not shown on the public status page.

### Status

The status of an application indicates whether the service is fully available to end users, may be experiencing disruption, or is in planned or unplanned outage. It is one of `operational`, `reported-issues`, `maintenance`, or `outage`.

### Health check

Health checks poll against an application endpoint to check for issues. It helps the tenant administrators monitor for issues. By default, health checks do not update the status. If `autoChangeStatus` is set on the application, the status changes from `operational` to `reported-issues` after the health check fails for 5 minutes, and back to `operational` after it succeeds for 5 minutes. Other statuses, such as `maintenance` and `outage`, are only changed manually.

The `toggle` endpoint starts or stops health checks immediately. The `enable` and `disable` endpoints change the setting, and health checks pick up the change when the service reloads them, every 5 minutes. Health check results older than 48 hours are deleted nightly.

### Notice

Notices are important messages to users regarding upcoming changes to an application. For example, they can be used to inform users of scheduled maintenance events or service disruptions. A notice is created as a `draft`, then `published`, and finally `archived`. Only draft notices can be edited or deleted, and only published notices are shown on the public status page.

## Events

Status service sends these domain events in the `status-service` namespace:

| Event                          | Sent when                                                                                 |
| :----------------------------- | :---------------------------------------------------------------------------------------- |
| `health-check-started`         | Health checks of an application are started (toggle).                                     |
| `health-check-stopped`         | Health checks of an application are stopped (toggle, or delete).                          |
| `application-healthy`          | A health check finds an application online after it was not.                              |
| `application-unhealthy`        | A health check finds an application offline after it was not.                             |
| `application-status-changed`   | The published status of an application is changed.                                        |
| `application-notice-published` | A notice is published.                                                                    |
| `monitored-service-down`       | An application is down for the interval configured for a webhook, or a webhook is tested. |
| `monitored-service-up`         | An application is back up after being reported down, or a webhook is tested.              |

The service consumes its own `health-check-started` and `health-check-stopped` events to start and stop health check jobs.

It also registers two notification types: `status-application-health-change` (health check started, stopped, healthy, and unhealthy; for `status-admin` subscribers) and `status-application-status-change` (status changed and notice published).

## Code examples

### Add an application and start health checks

```typescript
const statusServiceUrl = 'https://status-service.adsp.alberta.ca';

const response = await fetch(`${statusServiceUrl}/status/v1/applications`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Application',
    description: 'Online application for a benefit program.',
    endpoint: { url: 'https://my-application.alberta.ca/health' },
  }),
});
const { appKey } = await response.json();

// Toggle turns on health checks for the new application.
const toggled = await fetch(`${statusServiceUrl}/status/v1/applications/${appKey}/toggle`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}` },
});
const { enabled, internalStatus } = await toggled.json();
```

### Set the status of an application

```typescript
const response = await fetch(`https://status-service.adsp.alberta.ca/status/v1/applications/${appKey}/status`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'maintenance' }),
});
const { status, statusTimestamp } = await response.json();
```

### Read the public status of a tenant's applications

```typescript
const response = await fetch(`https://status-service.adsp.alberta.ca/public_status/v1/applications/${tenantName}`);
const applications = await response.json();
for (const { name, status, lastUpdated } of applications) {
  console.log(`${name}: ${status} (updated ${lastUpdated})`);
}
```

### Publish a notice

```typescript
const statusServiceUrl = 'https://status-service.adsp.alberta.ca';

// Requires the status-admin role.
const created = await fetch(`${statusServiceUrl}/notice/v1/notices`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'My Application will be down for weekly maintenance during the following hours.',
    tennantServRef: [{ id: 'my-application', name: 'My Application' }],
    isAllApplications: false,
    startDate: '2026-11-15T02:00:00.000Z',
    endDate: '2026-11-15T04:00:00.000Z',
  }),
});
const { id } = await created.json();

const published = await fetch(`${statusServiceUrl}/notice/v1/notices/${id}`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'published' }),
});
const { mode } = await published.json();
```

### Read the published notices of a tenant

```typescript
const response = await fetch(`https://status-service.adsp.alberta.ca/notice/v1/notices?name=${tenantName}`);
const { results, page } = await response.json();
// page.next is a query string, for example after=50&top=50, or null on the last page.
```
