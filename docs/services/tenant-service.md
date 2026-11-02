---
layout: page
title: Tenant service
nav_order: 1
parent: Services
---

# Tenant service
Tenant service provides the infrastructure for multi-tenancy in ADSP. It provides the APIs that allow for operations like creation of new tenants and lookup of tenants.

Tenant users and applications do not need to interact with tenant service directly.

## Client roles
client `urn:ads:platform:tenant-service`

| name | description |
|:-|:-|
| tenant-admin | Administrator role for tenant service. This role grants a user access to  tenant administration. It is also a composite role that includes roles for configuration of other platform services. |

## Audit actions
Tenant service records audit events in the `tenant-service` namespace of the [audit service](audit-service.md). Records are written to the affected tenant, with the tenant as the resource (`{ type: 'tenant', id: <tenant URN> }`) and the tenant name and realm in the metadata.

| action | category | severity | retention class | recorded when |
|:-|:-|:-|:-|:-|
| tenant.created | administrative | info | compliance | A tenant is created with an existing realm, or a new realm is provisioned for it. A failed provisioning is recorded with `failure` status. |
| tenant.deleted | administrative | critical | compliance | A tenant is deleted. |
| tenant.updated | administrative | info | compliance | A tenant is renamed. The change set captures the name before and after. |

Because the audit service resolves the tenant of each event, `tenant.deleted` is recorded before the realm and tenant are removed. If the removal does not fully succeed, a further `tenant.deleted` event is recorded with `failure` or `error` status; it cannot be stored if the tenant record itself was already removed.

Audit failures are logged as warnings and do not roll back the tenant operation. The tenant service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.
