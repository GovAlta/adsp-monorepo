---
title: Tenants
layout: page
nav_order: 3
parent: Access Service
grand_parent: Tutorials
---

## On Tenants and Realms

In the IdSP world realms and tenants are often used interchangeably to describe self-contained security and administrative domains. They are containers that holds a set of users, roles, clients, and other configurations within an identity and access management system, and each one can be considered an isolated environment. Keycloak uses the term _realm_ to refer to these domains.

ADSP, on the other hand, refers to them as _Tenants_. In this context a tenant is a keycloak realm with some pre-configured clients and roles that are specific to securing the ADSP API endpoints used by applications to gain access to it's services.

Each ministry in the DDD is associated with one or more tenants and each tenant, in turn, is associated with an application or group of applications. ADSP services require that you and your applications have access to one of these _Tenants_ in order to:

- authenticate and authorize calls to ADSP endpoints, and
- to log in to our Tenant Management Webapp in order to configure ADSP services for your applications.

Most application groups already have a Keycloak realm that they use for user management, and most realms have been configured as an ADSP tenant. If you, as a developer, are new to ADSP and want to start using one or more of its services it is very important that you take some time to identify an existing tenant that you might be able to use instead of requesting a new one from the ADSP team. It is important because:

- your application users may use other applications in your group, and will want the seamless integration between them that is provided through a tenant's SSO login capability,

- tenants are resource hungry, and we need to be sure that there are no other tenants that could be used to fulfill your requirements.

There are exceptions, however, and a new tenant may need to be created for your application.

### Use an existing tenant

Check with others in your application group to see if there is an existing tenant you can use. The product owner, service designer, architect, or others might know or can point you to someone who does. If you are able to find one then you can
ask the _realm owner_ to add you as a user with the _tenant admin_ role so that you can:

- log in to Keycloak and configure it as needed, and
- log in to ADSP's _Tenant Admin Webapp_ to configure it as needed.

The _realm owner_ will be a member of your group that has the responsibility for approving and adding developers as tenant-admins.

### Create a new Tenant

If you are unable to find or use an existing tenant, then you will need to create a new one. The process is fairly simple, requiring you to:

- sign in to the [Tenant Admin Webapp](https://adsp-uat.alberta.ca/), to create an account if you do not already have one. Simply signing in with your GoA email address is sufficient to create a new account.
- [contact the ADSP team](mailto:adsp@gov.ab.ca) to help you through the process.

We will assign your or another team member the _beta-tester_ role which will allow you to [create a tenant](https://adsp-uat.alberta.ca/).
