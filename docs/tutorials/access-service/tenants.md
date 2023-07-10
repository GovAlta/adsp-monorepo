---
title: Tenants
layout: page
nav_order: 3
parent: Access Service
grand_parent: Tutorials
---

## On Tenants and Realms

ADSP services require that you and your application have access to a keycloak _Tenant_, or realm, on the production and UAT servers. This is because:

- Service API calls require authentication, provided through access tokens, and
- you will need to log in to our Tenant Management Webapp in order to configuring a Service for your needs.

### Use an existing Tenant

Most application groups already have a Keycloak tenant, and it is important that you

If that's the case you need only ensure that you have been added as a user. If you have not, someone on your team will be able to do so.

### Create a new Tenant

If you are unable to find or use an existing tenant, then you will need to create a new one.
If your team does not already have a tenant set up for its applications then [contact the ADSP team](mailto:adsp@gov.ab.ca) to help you through the process. We will simply assign a team member the _beta-tester_ role, and they will be able to [create a tenant](https://adsp.alberta.ca/).
