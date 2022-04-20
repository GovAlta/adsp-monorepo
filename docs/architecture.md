---
layout: page
title: Architecture
nav_order: 3
---

# Architecture
TODO: High-level description of the architecture and how tenancy is handled.

## Multi-tenancy
For tenancy, a tenant service acts as a register of known tenants and each one is associated with a keycloak realm (jwt issuer). Platform services retrieve this information via the tenant service API and under a 'core' (non-tenant) context.

Users are authenticated against tenant realms and their requests to services are mapped to their tenant using the issuer of the token. Platform services are multi-tenant and can implement its own tenancy model; for example, a service could create tenant specific schemas in PostgreSQL.
