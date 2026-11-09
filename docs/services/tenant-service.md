---
layout: page
title: Tenant service
parent: Services
---

# Tenant service
Tenant service provides the infrastructure for multi-tenancy in ADSP. It provides the APIs that allow for operations like creation of new tenants and lookup of tenants.

Tenant users and applications do not need to interact with tenant service directly.

## Client roles
client `urn:ads:platform:tenant-service`

| name | description |
|:-|:-|
| tenant-admin | Administrator role for tenant service. This role grants a user access to tenant administration. It is also a composite role that includes roles for configuration of other platform services. |
| platform-service | Service role for backend services that read tenants. |

Tenant service also checks two core realm roles. They are realm roles of the `core` realm, not client roles, and are not registered by tenant service:

| name | description |
|:-|:-|
| tenant-service-admin | Platform administrator role. Allows creating tenants for any administrator or with an existing realm, renaming tenants, and deleting tenants. |
| beta-tester | Allows a core user to create a tenant with a new realm, with themselves as the administrator. |

No API operation checks the `platform-service` role: any authenticated core user or service account can read tenants. Services usually read tenants through the `tenantService` of the [Node.js SDK](../platform/platform-node-sdk.md) instead of calling the API.

## Tenancy
Tenant service manages the tenants themselves, so it doesn't use the `tenantId` query parameter of other services. Which tenants a request can see depends on who makes it:

- **Tenant users and service accounts** (with a token from a tenant realm) only find and retrieve their own tenant. `GET /api/tenant/v2/tenants` returns only their tenant, and `GET /api/tenant/v2/tenants/{id}` responds `403` for any other tenant ID.
- **Core users and service accounts** (with a token from the `core` realm) can find and retrieve any tenant. Creating, renaming, and deleting tenants require a core user with the roles above; tenant users are rejected even if they hold a role with the same name.
- **Anonymous requests** can search `GET /api/tenant/v2/tenants` by `name` or `realm`. Results don't include the administrator email. This is how applications resolve a tenant name to its realm before a user signs in.
- **Deprecated v1 lookups** (`GET /api/tenant/v1/{id}`, `GET /api/tenant/v1/realm/{realm}`, `POST /api/tenant/v1/email`, `POST /api/tenant/v1/name`) are available to any authenticated user and aren't limited to the user's own tenant. Use the v2 endpoints instead.

Search results only include `active` tenants. A tenant that is still `provisioning` can be retrieved by ID, but isn't found by search.

## API overview
All endpoints are under `https://tenant-service.adsp.alberta.ca`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas. Role checks in this API respond `401`, not `403`, when the user lacks the role.

| Endpoint | Purpose | Required role |
|:-|:-|:-|
| `GET /api/tenant/v2/tenants` | Search for tenants by name, realm, or administrator email. | None; anonymous with `name` or `realm` |
| `POST /api/tenant/v2/tenants` | Create a tenant. | core `beta-tester` or `tenant-service-admin` |
| `GET /api/tenant/v2/tenants/{id}` | Retrieve a tenant. | Any authenticated user; tenant users only their own tenant |
| `PATCH /api/tenant/v2/tenants/{id}/name` | Rename a tenant. Rate limited. | core `tenant-service-admin` |
| `DELETE /api/tenant/v2/tenants/{id}` | Delete a tenant and its realm. | core `tenant-service-admin` |

The following `/api/tenant/v1` endpoints are deprecated. They are documented in the API documentation so that existing callers can find their replacements:

| Deprecated endpoint | Required role | Replacement |
|:-|:-|:-|
| `POST /api/tenant/v1` | core `beta-tester` or `tenant-service-admin` | `POST /api/tenant/v2/tenants` |
| `GET /api/tenant/v1/{id}` | Any authenticated user | `GET /api/tenant/v2/tenants/{id}` |
| `DELETE /api/tenant/v1?realm={realm}` | core `tenant-service-admin` | `DELETE /api/tenant/v2/tenants/{id}` |
| `GET /api/tenant/v1/realm/{realm}` | Any authenticated user | `GET /api/tenant/v2/tenants?realm={realm}` |
| `POST /api/tenant/v1/email` | Any authenticated user | `GET /api/tenant/v2/tenants?adminEmail={email}` |
| `POST /api/tenant/v1/name` | Any authenticated user | `GET /api/tenant/v2/tenants?name={name}` |
| `GET /api/tenant/v1/realm/roles` | `tenant-admin` | None |

These `/api/tenant/v1` endpoints are not deprecated. They are internal endpoints used by the tenant admin app, and are rate limited:

| Endpoint | Purpose | Required role |
|:-|:-|:-|
| `GET /api/tenant/v1/user/id` | Look up the ID of a user by email in a realm. | `tenant-admin` |
| `GET /api/tenant/v1/user/default-idp` | Check if a core realm user is linked to the default identity provider. | `tenant-admin` |
| `DELETE /api/tenant/v1/user/idp` | Remove the link between a user and an identity provider. | `tenant-admin` |

## Concepts
### Tenant
A tenant represents a team or program area using ADSP. Its ID is a URN, for example `urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`; endpoints that take `{id}` use only the last segment. Other platform services store this ID on their records to isolate tenant data. Each tenant has a unique name (compared ignoring case), an administrator email, and a status:

- `provisioning`: the tenant was created and its realm is still being set up. `POST /api/tenant/v2/tenants` responds `202` with this status. If provisioning fails, the tenant is removed.
- `active`: the tenant and its realm are ready.

A user can be the administrator of only one tenant, unless a `tenant-service-admin` creates the tenant.

### Realm
Each tenant has its own Keycloak realm, which signs the access tokens of the tenant's users and service accounts. Platform services read the token issuer to work out which tenant a request is for. A new realm is created when a tenant is created, with the administrator given the `tenant-admin` role and clients for the platform apps and services. A `tenant-service-admin` can instead associate a tenant with an existing realm. Deleting a tenant also deletes its realm.

## Events
Tenant service sends the following domain events under the `tenant-service` namespace. It doesn't consume events.

| Event | Description |
|:-|:-|
| `tenant-created` | A tenant was created, either with an existing realm or once its new realm was provisioned. The payload includes the `tenant` and `createdBy`. |
| `tenant-deleted` | A tenant was deleted. The payload includes the `tenant` and `deletedBy`. |


## Audit actions
Tenant service records audit events in the `tenant-service` namespace of the [audit service](audit-service.md). Records are written to the affected tenant, with the tenant as the resource (`{ type: 'tenant', id: <tenant URN> }`) and the tenant name and realm in the metadata.

| action | category | severity | retention class | recorded when |
|:-|:-|:-|:-|:-|
| tenant.created | administrative | info | compliance | A tenant is created with an existing realm, or a new realm is provisioned for it. A failed provisioning is recorded with `failure` status. |
| tenant.deleted | administrative | critical | compliance | A tenant is deleted. |
| tenant.updated | administrative | info | compliance | A tenant is renamed. The change set captures the name before and after. |

Because the audit service resolves the tenant of each event, `tenant.deleted` is recorded before the realm and tenant are removed. If the removal does not fully succeed, a further `tenant.deleted` event is recorded with `failure` or `error` status; it cannot be stored if the tenant record itself was already removed.

Audit failures are logged by the SDK and do not roll back the tenant operation. The tenant service account requires the `audit-writer` role of `urn:ads:platform:audit-service`. Set `AUDIT_ENABLED=false` on tenant service to turn recording off; see [turn audit recording off](audit-service.md#turn-audit-recording-off).

## Code examples
### Look up a tenant by name
Anonymous requests can look up a tenant by name, for example to find the realm for signing in. Include a bearer token to also get the administrator email.

```typescript
const tenantServiceUrl = 'https://tenant-service.adsp.alberta.ca';

const response = await fetch(`${tenantServiceUrl}/api/tenant/v2/tenants?name=${encodeURIComponent('My Tenant')}`);
const { results } = await response.json();
const [tenant] = results;
// tenant.id, tenant.realm, tenant.name, tenant.status
```

### Retrieve a tenant by ID
Tenant users can retrieve their own tenant. Core users can retrieve any tenant.

```typescript
const id = tenant.id.split('/').pop();

const response = await fetch(`${tenantServiceUrl}/api/tenant/v2/tenants/${id}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const { name, realm, adminEmail } = await response.json();
```

### Create a tenant
Core users with the `beta-tester` role create a tenant with a new realm and become its administrator. The response is `202` with `status: 'provisioning'`; search by name until the tenant is found, which means it is `active`.

```typescript
const response = await fetch(`${tenantServiceUrl}/api/tenant/v2/tenants`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'My Tenant' }),
});
const { id, realm, status } = await response.json();
```
