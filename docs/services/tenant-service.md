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
