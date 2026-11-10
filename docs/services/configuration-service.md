---
layout: page
title: Configuration service
parent: Services
---

# Configuration service

Configuration service provides a store for infrequently changing configuration and includes a concept of revisions to support 'version locking' of configuration. The service can store arbitrary json objects as configuration with support for optional write-time validation using json schemas.

## Client roles

client `urn:ads:platform:configuration-service`

| name                 | description                                                                                                                                                                                                                                                                                                  |
| :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| configuration-admin  | Administrator role for configuration service. This role grants read and write access to configuration, including creating revisions, setting the active revision, and deleting configuration. It is part of the tenant-admin composite role and allows tenant administrators to configure platform services. |
| configuration-reader | Reader role for configuration service. This role is used to allow service accounts to read configuration.                                                                                                                                                                                                    |
| configured-service   | Service role for configuration service. This role grants service accounts read access to configuration, and lets them update the latest revision, for example to register their configuration on startup. It doesn't allow creating revisions, setting the active revision, or deleting configuration.       |

Configuration service also accepts the `urn:ads:platform:directory-service:resource-resolver` and `urn:ads:platform:export-service:export-job` roles for reading configuration, so that those platform services can resolve and export configuration resources.

## Tenancy

Configuration is either **tenant** configuration, which belongs to one tenant, or **core** (platform) configuration, which has no tenant. Both are identified by the same namespace and name, so a namespace and name can have core configuration and configuration in each tenant.

- **Tenant users and service accounts** always act on the configuration of the tenant of their token. On `GET /configuration/v2/configuration/{namespace}/{name}` and `/latest`, they can set the `core` query parameter to read core configuration instead; they can't modify core configuration.
- **Core users** (platform service accounts) act on the configuration of the tenant given by the `tenantId` query parameter. Without `tenantId`, they act on core configuration, including for writes.
- **Anonymous requests** to `/active` and `/latest` name the tenant in the `tenant` query parameter, since there is no token. Without it, they read core configuration. Anonymous reads are only allowed when the configuration definition sets `anonymousRead`, and are rate limited to 200 requests per IP address in 5 minutes.
- **Isolation.** A tenant user's requests are scoped to their tenant; there is no way for them to name another tenant's configuration. Finding configuration with `criteria` can't override the tenant.
- **Role scope.** Roles are checked in the tenant of the configuration, and core users with a role have it for every tenant. The exception is finding configuration in a namespace, where the configuration-admin role must be held in the tenant; core users need the configured-service or export-job role.

### Combining tenant and core configuration

Configuration service stores tenant and core configuration separately and doesn't merge them. Platform services that use the `adsp-service-sdk` (`configurationService.getConfiguration` or `getServiceConfiguration`) request both, as their core service account: once with `tenantId` for the tenant configuration and once without for core configuration. The SDK returns `[tenantConfiguration, coreConfiguration, revision]`, or the result of the `combineConfiguration` function the service passes to `initializePlatform`, so each service decides how a tenant overrides platform defaults. For example, event service merges the event namespaces of the tenant with the core (platform) namespaces, and a core namespace takes precedence over a tenant namespace of the same name.

The SDK reads the active revision, falling back to the latest revision (`/active?orLatest=true`), and caches the result. It clears its cache when it receives `configuration-updated` and `active-revision-set` events through the `configuration-updates` stream.

## API overview

All endpoints are under `https://configuration-service.adsp.alberta.ca/configuration/v2`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                                                     | Purpose                                                       | Required role                                                         |
| :----------------------------------------------------------- | :------------------------------------------------------------ | :-------------------------------------------------------------------- |
| `GET /configuration/{namespace}`                             | Find configuration in a namespace.                            | `configuration-admin` (tenant), `configured-service`, or `export-job` |
| `GET /configuration/{namespace}/{name}`                      | Read configuration with its latest and active revisions.      | `configuration-reader`, `configuration-admin`, `configured-service`   |
| `PATCH /configuration/{namespace}/{name}`                    | Update, replace, or remove properties of the latest revision. | `configuration-admin` or `configured-service`                         |
| `POST /configuration/{namespace}/{name}`                     | Create a revision, or set the active revision.                | `configuration-admin`                                                 |
| `DELETE /configuration/{namespace}/{name}`                   | Delete configuration and all its revisions.                   | `configuration-admin`                                                 |
| `GET /configuration/{namespace}/{name}/latest`               | Read the configuration of the latest revision.                | Any read role, or anonymous if the definition allows it               |
| `GET /configuration/{namespace}/{name}/active`               | Read the active revision.                                     | Any read role, or anonymous if the definition allows it               |
| `GET /configuration/{namespace}/{name}/revisions`            | List revisions, newest first.                                 | `configuration-reader`, `configuration-admin`, `configured-service`   |
| `GET /configuration/{namespace}/{name}/revisions/{revision}` | Read the configuration of a revision.                         | `configuration-reader`, `configuration-admin`, `configured-service`   |

The read roles also include the directory service `resource-resolver` and export service `export-job` roles. Configuration definitions have no endpoints of their own; they are configuration under `platform:configuration-service` (see [Configuration definition](#configuration-definition)).

## Concepts

### Configuration definition

Configuration definition is an optional metadata description for a particular _configuration_ (identified by a specific namespace and name). The definition provides write-time validation via json schema, and can set `anonymousRead` to allow reading the configuration without a token. Configuration definitions are configured in the configuration service under the `platform:configuration-service` namespace and name, keyed by `{namespace}:{name}`, or by `{namespace}` for a definition that applies to every name in a namespace. Core definitions apply to all tenants; a tenant can add definitions in its own `platform:configuration-service` configuration for configuration that has no core definition.

### Configuration

Configuration stores values represented by a json object at a particular namespace and name. Configuration includes _revisions_ that represent current and past value snapshots.

### Revision

Revisions are specific snapshots of _configuration_. Updates to configuration values are applied to the latest revision and the current value is captured in a snapshot when a new revision is created. This can be used to version lock configuration for consumers; the configured application should request a specific revision use deployment parameterization mechanisms, like environment variables, to allow for updating to later revisions.

### Active revision

The active revision is the revision that consumers should use. It is set with the `SET-ACTIVE-REVISION` operation, and services that use the `adsp-service-sdk` read it, falling back to the latest revision when none is set.

### Audit

Configuration service records audit events to the [audit service](audit-service.md) when tenant configuration is updated or deleted, revisions are created, the active revision is set, and configuration definitions change. Core configuration and the `audit-service` namespace are not audited. Audit failures are logged by the SDK and do not fail the configuration operation. The configuration service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.

| Action                              | Recorded when                                                  |
| :---------------------------------- | :------------------------------------------------------------- |
| `configuration.updated`             | Configuration is updated or replaced. Includes the change set. |
| `configuration.deleted`             | Configuration is deleted.                                      |
| `configuration.revision-created`    | A revision is created.                                         |
| `configuration.active-revision-set` | The active revision is changed.                                |
| `configuration-definition.created`  | A definition is added to `platform:configuration-service`.     |
| `configuration-definition.updated`  | A definition in `platform:configuration-service` is changed.   |
| `configuration-definition.deleted`  | A definition is removed from `platform:configuration-service`. |

Audit recording is on by default. Set the environment variable `CONFIGURATION_AUDIT_ENABLED=false` on configuration service to turn it off, or `true` to turn it on regardless of the SDK `AUDIT_ENABLED` variable, which applies when `CONFIGURATION_AUDIT_ENABLED` is not set. The action catalog is still registered while recording is off, so turning it back on needs only a restart.

## Events

Configuration service sends these domain events, in the `configuration-service` namespace, for tenant configuration. Changes to core configuration don't send `configuration-updated` or `revision-created` events.

| Event                   | Sent when                                                                                                  |
| :---------------------- | :--------------------------------------------------------------------------------------------------------- |
| `configuration-updated` | The latest revision is changed by `PATCH`. Includes the operation, the update data, and the size in bytes. |
| `configuration-deleted` | Configuration and its revisions are deleted.                                                               |
| `revision-created`      | A revision is created by `CREATE-REVISION`.                                                                |
| `active-revision-set`   | The active revision is changed by `SET-ACTIVE-REVISION`.                                                   |

The `configuration-updates` [push service](push-service.md) stream delivers `configuration-updated`, `revision-created`, and `active-revision-set` events to subscribers with a configuration service role, for cache invalidation. Configuration service doesn't consume domain events.

## Code examples

### Read a revision of configuration

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
const namespace = 'support';
const name = 'formula-values';
const response = await fetch(
  `${configurationServiceUrl}/configuration/v2/configuration/${namespace}/${name}/revisions/1`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);
const configuration = await response.json();
```

### Read tenant and core configuration as a platform service

Core service accounts set `tenantId` to read a tenant's configuration, and leave it out to read core configuration.

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7';
const url = `${configurationServiceUrl}/configuration/v2/configuration/platform/event-service/active?orLatest=true`;
const headers = { Authorization: `Bearer ${accessToken}` };

const tenantResponse = await fetch(`${url}&tenantId=${encodeURIComponent(tenantId)}`, { headers });
const coreResponse = await fetch(url, { headers });

const { revision, configuration: tenantConfiguration } = await tenantResponse.json();
const { configuration: coreConfiguration } = await coreResponse.json();
```

### Update configuration

Updates are applied to the latest revision of configuration.

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
const namespace = 'support';
const name = 'formula-values';
const request = {
  operation: 'UPDATE',
  update: {
    valueA: 'this is a configuration value',
    valueB: 123,
  },
};

const response = await fetch(`${configurationServiceUrl}/configuration/v2/configuration/${namespace}/${name}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
const { latest } = await response.json();
```

### Create a revision

Create a revision to snapshot the latest configuration. The snapshot cannot be modified afterwards.

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
const namespace = 'support';
const name = 'formula-values';

const response = await fetch(`${configurationServiceUrl}/configuration/v2/configuration/${namespace}/${name}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ operation: 'CREATE-REVISION' }),
});
const { latest } = await response.json();
```

### Set the active revision

```typescript
const response = await fetch(`${configurationServiceUrl}/configuration/v2/configuration/${namespace}/${name}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ operation: 'SET-ACTIVE-REVISION', revision: latest.revision }),
});
const { active } = await response.json();
```
