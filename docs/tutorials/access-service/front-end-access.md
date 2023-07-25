---
title: Front End Access
layout: page
nav_order: 5
parent: Access Service
grand_parent: Tutorials
---

## Front End Access

There are a couple of security concerns when accessing the ADSP APIs from javascript in the front-end (browser) of an application, including

- cross origin resource sharing (CORS), and
- exposing client secrets

However, Keycloak allows you to whitelist the ADSP services mitigating the CORS concern, and the JWT token created when a user logs in can be used as an access token for ADSP services.

### Cross Origin Resource Sharing (CORS)

If you wish to use the ADSP APIs from within your front-end application (i.e. a browser) you may have to configure your application client to whitelist the ADSP APIs. To do so, log in to your Keycloak realm, select the client you wish to configure, and find the _web origins_ input widget.

![](/adsp-monorepo/assets/access-service/web-origins.png){: width="500" }

There you can enter (and save) the appropriate ADSP domain for your environment.

### User access to ADSP

When accessing ADSP services from the back end it is reasonable to login in with a client ID (usually your application client), and pulling the secret out of a vault such as those stored in OpenShift. This is not a technique that is readily available to front-end applications, however. In fact, there really isn't a secure way to get a secret in the front end application, as they are exposed and vulnerable to man-in-the-middle and other attacks. Client logins from the front end are considered bad practice for this reason.

Most DDD applications however, require a user to login before gaining access to resources. The user authentication process yields a JWT containing the essential information that ADSP uses to authorize a request. However, this means that your users must be authorized to use ADSP and have all the roles and permissions that a client must have for the same purpose. There are a few ways to set up user roles.

If your application has relatively few users, you can set the roles by:

- logging in to the Keycloak admin panel
- selecting Users from the left hand side menu
- selecting the _Role Mapping_ tab
- adding the appropriate roles.

If you register users on the fly, you can add roles via one of the Keycloak APIs. e.g.

```
curl -X POST 'https://access-uat.alberta.ca/auth/admin/realms/{realm}/users/{user-id}/role-mappings/realm' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {admin-access-token}' \
  -d '[
        {
            "id": "role-id",
            "name": "role-name",
            "composite": false
        }
    ]'

```
